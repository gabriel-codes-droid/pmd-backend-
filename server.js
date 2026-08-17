import express from "express";

import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import mealRoutes from "./routes/mealRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import savingsRoutes from "./routes/savingsRoutes.js";
import trashRoutes from "./routes/trashRoutes.js";

// --- env validation ---
const required = ["JWT_SECRET", "MONGO_URI"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
    console.error(`FATAL: missing required env vars: ${missing.join(", ")}`);
    console.error("Set them in your .env (dev) or Render dashboard (prod).");
    process.exit(1);
}
if ((process.env.JWT_SECRET || "").length < 32) {
    console.error("FATAL: JWT_SECRET must be at least 32 characters in production.");
    process.exit(1);
}

const app = express();

// Trust Render's proxy so express-rate-limit + req.ip work correctly behind the load balancer
app.set("trust proxy", 1);

app.use(helmet());

// Dynamic CORS: allow configured origins + any localhost port in dev
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin) return cb(null, true); // same-origin / curl / server-to-server
            if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) return cb(null, true);
            // In development, allow any localhost port so vite can use 5173-5185+
            if (process.env.NODE_ENV !== "production" && /^https?:\/\/localhost:\d+$/.test(origin)) {
                return cb(null, true);
            }
            return cb(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
    })
);

app.use(express.json({ limit: "1mb" }));

// Rate limit auth endpoints harder than the rest
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many auth attempts, slow down." },
});
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", generalLimiter);

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
});

mongoose.connection.once("open", () => {
    console.log("MongoDB Connected");
});

mongoose.connection.on("error", (err) => {
    console.error("MongoDB error:", err.message);
});

app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        service: "pmd-backend",
        mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        time: new Date().toISOString(),
        env: process.env.NODE_ENV || "development",
    });
});

app.use("/api/meals", mealRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/finances", financeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/trash", trashRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`PMD backend running on port ${port} (env=${process.env.NODE_ENV || "development"})`);
});
