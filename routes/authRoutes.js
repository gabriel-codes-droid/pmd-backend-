import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/users.js";
import { authRequired } from "../middleware/auth.js";

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

export default router;
