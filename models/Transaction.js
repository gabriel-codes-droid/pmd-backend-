import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: {
        type: String,
        enum: ["salary", "food", "transport", "shopping", "bills", "entertainment", "health", "other"],
        default: "other",
    },
    type: {
        type: String,
        enum: ["income", "expense"],
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
