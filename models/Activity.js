import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    priority: {
        type: String,
        default: "Medium"
    },

    completed: {
        type: Boolean,
        default: false
    }
});

const Activity = mongoose.model(
    "Activity",
    activitySchema
);

export default Activity;