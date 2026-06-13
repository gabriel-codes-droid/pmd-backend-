import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
    title: String,

    calories: Number,

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

const Meal = mongoose.model("Meal", mealSchema);

export default Meal;