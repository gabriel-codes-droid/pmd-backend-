import express from "express";
import Transaction from "../models/Transaction.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

router.get("/", async (req, res) => {
    const transactions = await Transaction.find({ userId: req.user._id, deletedAt: null }).sort({ createdAt: -1 });
    res.json(transactions);
});

router.post("/", async (req, res) => {
    const { description, amount, category, type } = req.body;
    if (!description || amount == null || !type) {
        return res.status(400).json({ message: "Description, amount, and type are required" });
    }
    const tx = await Transaction.create({
        description,
        amount: Number(amount),
        category: category || "other",
        type,
        userId: req.user._id,
    });
    res.status(201).json(tx);
});

router.put("/:id", async (req, res) => {
    const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    const { description, amount, category, type } = req.body;
    if (description != null) tx.description = description;
    if (amount != null) tx.amount = Number(amount);
    if (category != null) tx.category = category;
    if (type != null) tx.type = type;
    await tx.save();
    res.json(tx);
});

router.delete("/:id", async (req, res) => {
    // Soft delete — moves to Trash instead of permanently removing, so it can
    // be restored later or emptied explicitly from the Trash page.
    const deleted = await Transaction.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
    );
    if (!deleted) return res.status(404).json({ message: "Transaction not found" });
    res.json({ message: "Transaction moved to trash" });
});

export default router;
