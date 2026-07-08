import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
    title: { type: String, required: true },
    calories: { type: Number, required: true },
    category: {
        type: String,
        enum: ["breakfast", "lunch", "dinner", "snack"],
        default: "snack",
    },
    source: {
        type: String,
        enum: ["manual", "api", "dish"],
        default: "manual",
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });

const Meal = mongoose.model("Meal", mealSchema);

export default Meal;
