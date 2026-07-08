import express from "express";
import Meal from "../models/Meal.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

router.get("/", async (req, res) => {
    const meals = await Meal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(meals);
});

router.post("/", async (req, res) => {
    const { title, calories, category, source } = req.body;
    if (!title || calories == null) {
        return res.status(400).json({ message: "Title and calories are required" });
    }
    const meal = await Meal.create({
        title,
        calories: Number(calories),
        category: category || "snack",
        source: source || "manual",
        userId: req.user._id,
    });
    res.status(201).json(meal);
});

router.put("/:id", async (req, res) => {
    const meal = await Meal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!meal) return res.status(404).json({ message: "Meal not found" });
    const { title, calories, category, source } = req.body;
    if (title != null) meal.title = title;
    if (calories != null) meal.calories = Number(calories);
    if (category != null) meal.category = category;
    if (source != null) meal.source = source;
    await meal.save();
    res.json(meal);
});

router.delete("/:id", async (req, res) => {
    const deleted = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ message: "Meal not found" });
    res.json({ message: "Meal deleted" });
});

export default router;
