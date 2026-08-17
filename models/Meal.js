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
    // Nutrition fields
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugars: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },
    // Product metadata
    barcode: { type: String },
    brand: { type: String },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });

const Meal = mongoose.model("Meal", mealSchema);

export default Meal;
