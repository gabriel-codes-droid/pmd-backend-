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
    },
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
}
});

const Activity = mongoose.model(
    "Activity",
    activitySchema
    
);

export default Activity;