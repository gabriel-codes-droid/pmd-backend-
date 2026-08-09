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

// Get single user details with stats
router.get("/users/:id/stats", async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const [transactions, meals, activities] = await Promise.all([
        Transaction.countDocuments({ userId: user._id }),
        Meal.countDocuments({ userId: user._id }),
        Activity.countDocuments({ userId: user._id }),
    ]);
    
    res.json({
        user,
        stats: { transactions, meals, activities }
    });
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

// Ban/Unban user
router.put("/users/:id/ban", async (req, res) => {
    const { banned } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { banned }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
});

// Get user activity (placeholder - would need activity logging system)
router.get("/users/:id/activity", async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Mock activity data - in production, this would come from an activity log
    const activities = [
        { action: "Account Created", timestamp: user.createdAt, details: "User registration" },
        { action: "Last Login", timestamp: new Date(), details: "Recent login" },
    ];
    
    res.json({ user, activities });
});

// System stats
router.get("/stats", async (req, res) => {
    const [users, transactions, meals, activities] = await Promise.all([
        User.countDocuments(),
        Transaction.countDocuments(),
        Meal.countDocuments(),
        Activity.countDocuments(),
    ]);
    res.json({ totalUsers: users, totalTransactions: transactions, totalMeals: meals, totalActivities: activities });
});

// Get detailed system analytics
router.get("/analytics", async (req, res) => {
    const [
        totalUsers,
        activeUsers,
        totalTransactions,
        totalMeals,
        totalActivities,
        recentSignups
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
        Transaction.countDocuments(),
        Meal.countDocuments(),
        Activity.countDocuments(),
        User.find().sort({ createdAt: -1 }).limit(5).select("-password"),
    ]);
    
    const revenueData = await Transaction.aggregate([
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: "$amount" } } },
        { $sort: { _id: 1 } },
        { $limit: 6 }
    ]);
    
    res.json({
        users: { total: totalUsers, activeLast30Days: activeUsers, recentSignups },
        engagement: { transactions: totalTransactions, meals: totalMeals, activities: totalActivities },
        revenue: revenueData
    });
});

export default router;
