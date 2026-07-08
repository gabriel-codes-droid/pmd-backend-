// Run once to seed the admin account: `node seed-admin.js`
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/users.js";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@pmd.local").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Admin";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pmd";

const run = async () => {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
        existing.role = "admin";
        await existing.save();
        console.log(`Admin already exists (${ADMIN_EMAIL}). Role ensured.`);
        process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hash,
        role: "admin",
    });

    console.log("Admin user created:");
    console.log(`  email:    ${ADMIN_EMAIL}`);
    console.log(`  password: ${ADMIN_PASSWORD}`);
    console.log("(change the password from the UI after first login)");
    process.exit(0);
};

run().catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
});
