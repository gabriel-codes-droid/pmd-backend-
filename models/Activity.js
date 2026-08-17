import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    done: { type: Boolean, default: false },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;


