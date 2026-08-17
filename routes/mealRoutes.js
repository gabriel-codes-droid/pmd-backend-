import express from "express";
import Meal from "../models/Meal.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

router.get("/", async (req, res) => {
    const meals = await Meal.find({ userId: req.user._id, deletedAt: null }).sort({ createdAt: -1 });
    res.json(meals);
});

router.post("/", async (req, res) => {
    const { title, calories, category, source, protein, carbs, fat, fiber, sugars, sodium, barcode, brand } = req.body;
    if (!title || calories == null) {
        return res.status(400).json({ message: "Title and calories are required" });
    }
    const meal = await Meal.create({
        title,
        calories: Number(calories),
        category: category || "snack",
        source: source || "manual",
        protein: protein != null ? Number(protein) : undefined,
        carbs: carbs != null ? Number(carbs) : undefined,
        fat: fat != null ? Number(fat) : undefined,
        fiber: fiber != null ? Number(fiber) : undefined,
        sugars: sugars != null ? Number(sugars) : undefined,
        sodium: sodium != null ? Number(sodium) : undefined,
        barcode: barcode || undefined,
        brand: brand || undefined,
        userId: req.user._id,
    });
    res.status(201).json(meal);
});

router.put("/:id", async (req, res) => {
    const meal = await Meal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!meal) return res.status(404).json({ message: "Meal not found" });
    const { title, calories, category, source, protein, carbs, fat, fiber, sugars, sodium, barcode, brand } = req.body;
    if (title != null) meal.title = title;
    if (calories != null) meal.calories = Number(calories);
    if (category != null) meal.category = category;
    if (source != null) meal.source = source;
    if (protein != null) meal.protein = Number(protein);
    if (carbs != null) meal.carbs = Number(carbs);
    if (fat != null) meal.fat = Number(fat);
    if (fiber != null) meal.fiber = Number(fiber);
    if (sugars != null) meal.sugars = Number(sugars);
    if (sodium != null) meal.sodium = Number(sodium);
    if (barcode != null) meal.barcode = barcode;
    if (brand != null) meal.brand = brand;
    await meal.save();
    res.json(meal);
});

router.delete("/:id", async (req, res) => {
    const deleted = await Meal.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
    );
    if (!deleted) return res.status(404).json({ message: "Meal not found" });
    res.json({ message: "Meal moved to trash" });
});

export default router;
