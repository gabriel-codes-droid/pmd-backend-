import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    password: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },

    banned: {
        type: Boolean,
        default: false,
    },

    lastLogin: {
        type: Date,
    },

    profileImage: {
        type: String,
        default: null,
    },

    resetToken: {
        type: String,
        default: null,
    },

    resetExpires: {
        type: Date,
        default: null,
    },

    emailNotificationsEnabled: {
        type: Boolean,
        default: false,
    },

    notificationFrequency: {
        type: String,
        enum: ["daily", "weekly", "never"],
        default: "daily",
    },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
