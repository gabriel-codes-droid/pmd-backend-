import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    },
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
}
});

const Transaction = mongoose.model(
    "Transaction",
    transactionSchema
);

export default Transaction;