import express from "express";

import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import mealRoutes from "./routes/mealRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pmd";

mongoose.connect(MONGO_URI).catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
});

mongoose.connection.once("open", () => {
    console.log("MongoDB Connected");
});

mongoose.connection.on("error", err => {
    console.error("MongoDB error:", err.message);
});

app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        time: new Date().toISOString(),
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/finances", financeRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`PMD backend running on http://localhost:${port}`);
});
