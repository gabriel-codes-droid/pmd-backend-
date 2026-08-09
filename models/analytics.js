import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    eventType: {
        type: String,
        enum: ["page_view", "click", "form_submit", "api_call", "error", "feature_use"],
        required: true,
    },
    page: {
        type: String,
    },
    action: {
        type: String,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    userAgent: {
        type: String,
    },
    ipAddress: {
        type: String,
    },
}, { timestamps: true });

// Index for efficient queries
analyticsSchema.index({ userId: 1, timestamp: -1 });
analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ timestamp: -1 });

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;