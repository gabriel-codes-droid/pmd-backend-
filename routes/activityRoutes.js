import express from "express";
import Activity from "../models/Activity.js";

const router = express.Router();

router.get("/", async (req, res) => {

    const activities = await Activity.find();

    res.json(activities);

});

router.post("/", async (req, res) => {

    const activity = new Activity({
        title: req.body.title,
        priority: req.body.priority
    });

    await activity.save();

    res.json(activity);

});

router.put("/:id", async (req, res) => {

    const activity = await Activity.findById(
        req.params.id
    );

    activity.completed = !activity.completed;

    await activity.save();

    res.json(activity);

});

router.delete("/:id", async (req, res) => {

    await Activity.findByIdAndDelete(
        req.params.id
    );

    res.json({
        message: "Activity deleted"
    });

});

export default router;
