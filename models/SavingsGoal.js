import mongoose from "mongoose";

const savingsGoalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    target: { type: Number, required: true },
    current: { type: Number, default: 0 },
    deadline: { type: Date },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });

const SavingsGoal = mongoose.model("SavingsGoal", savingsGoalSchema);

export default SavingsGoal;
