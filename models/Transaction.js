import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    }
});

const Transaction = mongoose.model(
    "Transaction",
    transactionSchema
);

export default Transaction;