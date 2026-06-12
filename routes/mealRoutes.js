import express from "express";
import Meal from "../models/Meal.js";

const router = express.Router();

router.get("/", async (req, res) => {

    const meals = await Meal.find();

    res.json(meals);

});

router.post("/", async (req, res) => {

    const meal = new Meal({
        title: req.body.title,
        calories: req.body.calories
    });

    await meal.save();

    res.json(meal);

});

router.delete("/:id", async (req, res) => {

    await Meal.findByIdAndDelete(req.params.id);

    res.json({
        message: "Meal deleted"
    });

});

export default router;