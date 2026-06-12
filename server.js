import express from 'express'
import mongoose from 'mongoose'
import mealRoutes from "./routes/mealRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";

const app = express();


mongoose.connect("mongodb://127.0.0.1:27017/pmd");

mongoose.connection.once("open", () => {
    console.log("MongoDB Connected");
});

app.use("/api/meals", mealRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/finances", financeRoutes);
const port = process.env.PORT || 8000;
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})