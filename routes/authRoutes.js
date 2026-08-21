import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/users.js";
import { authRequired } from "../middleware/auth.js";
import { sendEmail } from "../services/email.js";

const router = express.Router();

const signToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "30d" });

const sanitize = (u) => ({
    _id: u._id,
    username: u.username,
    email: u.email,
    role: u.role,
    lastLogin: u.lastLogin,
    createdAt: u.createdAt,
    profileImage: u.profileImage,
});

router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body || {};
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        const cleanEmail = email.toLowerCase().trim();
        const cleanUsername = username.trim();

        const emailExists = await User.findOne({ email: cleanEmail });
        if (emailExists) {
            return res.status(409).json({
                message: "This email is already registered. Try signing in instead.",
                field: "email",
            });
        }
        const usernameExists = await User.findOne({ username: cleanUsername });
        if (usernameExists) {
            return res.status(409).json({
                message: "That username is already taken. Please choose another.",
                field: "username",
            });
        }

        const hash = await bcrypt.hash(password, 10);
        const user = await User.create({
            username: cleanUsername,
            email: cleanEmail,
            password: hash,
            role: "user",
        });

        const token = signToken(user);
        res.status(201).json({ token, user: sanitize(user) });
    } catch (err) {
        // surface duplicate-key (unique index) races as friendly 409s
        if (err && err.code === 11000) {
            const dupField = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
            const nice = dupField === "email"
                ? "This email is already registered. Try signing in instead."
                : "That username is already taken. Please choose another.";
            return res.status(409).json({ message: nice, field: dupField });
        }
        if (err && err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: err.message || "Server error" });
    }
});

// Live availability check (debounced from the signup form) so the user
// can see "email already exists" before they hit submit.
router.get("/check-email", async (req, res) => {
    try {
        const email = String(req.query.email || "").toLowerCase().trim();
        if (!email) return res.status(400).json({ message: "email is required" });
        const exists = await User.findOne({ email }).select("_id").lean();
        res.json({ available: !exists });
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
});

router.get("/check-username", async (req, res) => {
    try {
        const username = String(req.query.username || "").trim();
        if (!username) return res.status(400).json({ message: "username is required" });
        const exists = await User.findOne({ username }).select("_id").lean();
        res.json({ available: !exists });
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ message: "Invalid credentials" });

        if (user.banned) {
            return res.status(403).json({ message: "Account banned. Contact support." });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = signToken(user);
        res.json({ token, user: sanitize(user) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/me", authRequired, (req, res) => {
    res.json({ user: sanitize(req.user) });
});

// Forgot password - send reset code via email
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            // Don't reveal if email exists for security
            return res.json({ message: "If the email exists, a reset code has been sent" });
        }

        // Generate 6-digit reset code
        const resetCode = crypto.randomInt(100000, 999999).toString();
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store both the code and token (for verification)
        user.resetToken = `${resetCode}:${resetToken}`;
        user.resetExpires = resetExpires;
        await user.save();

        // Send email with reset code. This is deliberately isolated from the
        // outer try/catch: a delivery failure (e.g. Resend's sandbox only
        // allows sending to the account owner's own email until a domain is
        // verified) must never leak into the response or turn into a 500 —
        // that would both expose Resend's internals to the client and betray
        // whether this email exists, which is exactly what the generic
        // response below is trying to avoid.
        try {
            await sendEmail({
                to: user.email,
                subject: "PMD Password Reset Code",
                text: `Your password reset code is: ${resetCode}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this, please ignore this email.`
            });
        } catch (sendErr) {
            console.error("Password reset email failed to send:", sendErr.message);
        }

        res.json({ message: "If the email exists, a reset code has been sent" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify reset code
router.post("/verify-reset-code", async (req, res) => {
    try {
        const { email, code } = req.body || {};
        if (!email || !code) {
            return res.status(400).json({ message: "Email and code are required" });
        }

        const user = await User.findOne({ 
            email: email.toLowerCase().trim(),
            resetExpires: { $gt: new Date() }
        });

        if (!user || !user.resetToken) {
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        // Extract the code from the stored token (format: "code:token")
        const storedCode = user.resetToken.split(':')[0];
        if (storedCode !== code) {
            return res.status(400).json({ message: "Invalid reset code" });
        }

        res.json({ message: "Code verified", resetToken: user.resetToken });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reset password with code
router.post("/reset-password", async (req, res) => {
    try {
        const { email, code, newPassword } = req.body || {};
        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: "Email, code, and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            resetExpires: { $gt: new Date() }
        });

        // resetToken is stored as "code:token" (see /forgot-password) —
        // comparing the raw field against `code` directly can never match,
        // since the stored value also has the token half appended.
        if (!user || !user.resetToken || user.resetToken.split(':')[0] !== code) {
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        user.password = hash;
        user.resetToken = null;
        user.resetExpires = null;
        await user.save();

        res.json({ message: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update profile image
router.put("/profile-image", authRequired, async (req, res) => {
    try {
        const { profileImage } = req.body || {};
        if (!profileImage) {
            return res.status(400).json({ message: "Profile image is required" });
        }

        // Validate image size (max 5MB for base64)
        if (profileImage.length > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "Image size exceeds 5MB limit" });
        }

        // Validate that it's a data URL
        if (!profileImage.startsWith('data:image/')) {
            return res.status(400).json({ message: "Invalid image format" });
        }

        req.user.profileImage = profileImage;
        await req.user.save();

        res.json({ user: sanitize(req.user) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Change password (authenticated)
router.put("/change-password", authRequired, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const ok = await bcrypt.compare(currentPassword, req.user.password);
        if (!ok) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        req.user.password = hash;
        await req.user.save();

        res.json({ message: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
