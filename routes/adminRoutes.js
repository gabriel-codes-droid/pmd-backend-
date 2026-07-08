import express from "express";
import User from "../models/users.js";
import Transaction from "../models/Transaction.js";
import Meal from "../models/Meal.js";
import Activity from "../models/Activity.js";
import { authRequired, adminRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired, adminRequired);

// List all users (without passwords)
router.get("/users", async (req, res) => {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
});

// Delete a user (and their data)
router.delete("/users/:id", async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Cannot delete admin" });
    await Promise.all([
        Transaction.deleteMany({ userId: user._id }),
        Meal.deleteMany({ userId: user._id }),
        Activity.deleteMany({ userId: user._id }),
        User.findByIdAndDelete(user._id),
    ]);
    res.json({ message: "User and their data deleted" });
});

// Toggle admin role
router.put("/users/:id/role", async (req, res) => {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
});

// System stats
router.get("/stats", async (req, res) => {
    const [users, transactions, meals, activities] = await Promise.all([
        User.countDocuments(),
        Transaction.countDocuments(),
        Meal.countDocuments(),
        Activity.countDocuments(),
    ]);
    res.json({ users, transactions, meals, activities });
});

export default router;
