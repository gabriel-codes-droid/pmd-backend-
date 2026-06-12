import express from "express";
import Transaction from "../models/Transaction.js";

const router = express.Router();

router.get("/", async (req, res) => {

    const transactions =
        await Transaction.find();

    res.json(transactions);

});

router.post("/", async (req, res) => {

    const transaction =
        new Transaction({
            description: req.body.description,
            amount: req.body.amount
        });

    await transaction.save();

    res.json(transaction);

});

router.delete("/:id", async (req, res) => {

    await Transaction.findByIdAndDelete(
        req.params.id
    );

    res.json({
        message: "Transaction deleted"
    });

});

export default router;