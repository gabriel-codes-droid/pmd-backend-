import express from "express";
import Transaction from "../models/Transaction.js";
import Meal from "../models/Meal.js";
import Activity from "../models/Activity.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

const MODELS = { transaction: Transaction, meal: Meal, activity: Activity };

// List everything currently in the trash across all item types
router.get("/", async (req, res) => {
    const [transactions, meals, activities] = await Promise.all([
        Transaction.find({ userId: req.user._id, deletedAt: { $ne: null } }),
        Meal.find({ userId: req.user._id, deletedAt: { $ne: null } }),
        Activity.find({ userId: req.user._id, deletedAt: { $ne: null } }),
    ]);

    const items = [
        ...transactions.map(t => ({
            id: t._id,
            itemType: "transaction",
            title: t.description,
            details: `${t.type === "income" ? "+" : "-"}$${t.amount}`,
            deletedAt: t.deletedAt,
        })),
        ...meals.map(m => ({
            id: m._id,
            itemType: "meal",
            title: m.title,
            details: `${m.calories} kcal`,
            deletedAt: m.deletedAt,
        })),
        ...activities.map(a => ({
            id: a._id,
            itemType: "activity",
            title: a.title,
            details: a.description,
            deletedAt: a.deletedAt,
        })),
    ].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    res.json(items);
});

// Restore a single item back to its original list
router.post("/:type/:id/restore", async (req, res) => {
    const Model = MODELS[req.params.type];
    if (!Model) return res.status(400).json({ message: "Invalid item type" });

    const doc = await Model.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { deletedAt: null },
        { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Item not found" });
    res.json(doc);
});

// Permanently delete a single trashed item
router.delete("/:type/:id", async (req, res) => {
    const Model = MODELS[req.params.type];
    if (!Model) return res.status(400).json({ message: "Invalid item type" });

    const deleted = await Model.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Permanently deleted" });
});

// Empty the whole trash
router.delete("/", async (req, res) => {
    await Promise.all([
        Transaction.deleteMany({ userId: req.user._id, deletedAt: { $ne: null } }),
        Meal.deleteMany({ userId: req.user._id, deletedAt: { $ne: null } }),
        Activity.deleteMany({ userId: req.user._id, deletedAt: { $ne: null } }),
    ]);
    res.json({ message: "Trash emptied" });
});

export default router;
