import express from "express";
import Activity from "../models/Activity.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

router.get("/", async (req, res) => {
    const activities = await Activity.find({ userId: req.user._id }).sort({ startTime: 1 });
    res.json(activities);
});

router.post("/", async (req, res) => {
    const { title, description, startTime, endTime } = req.body;
    if (!title || !startTime || !endTime) {
        return res.status(400).json({ message: "Title, startTime, and endTime are required" });
    }
    if (new Date(endTime) <= new Date(startTime)) {
        return res.status(400).json({ message: "End time must be after start time" });
    }
    const activity = await Activity.create({
        title,
        description: description || "",
        startTime,
        endTime,
        userId: req.user._id,
    });
    res.status(201).json(activity);
});

router.put("/:id", async (req, res) => {
    const activity = await Activity.findOne({ _id: req.params.id, userId: req.user._id });
    if (!activity) return res.status(404).json({ message: "Activity not found" });
    const { title, description, startTime, endTime, done } = req.body;
    if (title != null) activity.title = title;
    if (description != null) activity.description = description;
    if (startTime != null) activity.startTime = startTime;
    if (endTime != null) activity.endTime = endTime;
    if (done != null) activity.done = !!done;
    await activity.save();
    res.json(activity);
});

router.delete("/:id", async (req, res) => {
    const deleted = await Activity.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ message: "Activity not found" });
    res.json({ message: "Activity deleted" });
});

export default router;
