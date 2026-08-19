import express from "express";
import SavingsGoal from "../models/SavingsGoal.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

router.get("/", async (req, res) => {
    const goals = await SavingsGoal.find({ userId: req.user._id, deletedAt: null }).sort({ createdAt: -1 });
    res.json(goals);
});

router.post("/", async (req, res) => {
    const { name, target, current, deadline } = req.body;
    if (!name || target == null) {
        return res.status(400).json({ message: "Name and target are required" });
    }
    const goal = await SavingsGoal.create({
        name,
        target: Number(target),
        current: current != null ? Number(current) : 0,
        deadline: deadline || undefined,
        userId: req.user._id,
    });
    res.status(201).json(goal);
});

router.put("/:id", async (req, res) => {
    const goal = await SavingsGoal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: "Savings goal not found" });
    const { name, target, current, deadline } = req.body;
    if (name != null) goal.name = name;
    if (target != null) goal.target = Number(target);
    if (current != null) goal.current = Number(current);
    if (deadline != null) goal.deadline = deadline;
    await goal.save();
    res.json(goal);
});

router.delete("/:id", async (req, res) => {
    const deleted = await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ message: "Savings goal not found" });
    res.json({ message: "Savings goal deleted" });
});

export default router;
