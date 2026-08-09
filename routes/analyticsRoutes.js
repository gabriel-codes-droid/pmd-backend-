import express from "express";
import Analytics from "../models/analytics.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);

// Track an event
router.post("/track", async (req, res) => {
    try {
        const { eventType, page, action, metadata } = req.body;
        
        const analytics = new Analytics({
            userId: req.user._id,
            eventType,
            page,
            action,
            metadata,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
        });
        
        await analytics.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        res.status(500).json({ message: "Failed to track event" });
    }
});

// Get user's own analytics
router.get("/my-stats", async (req, res) => {
    try {
        const userId = req.user._id;
        
        const [
            totalEvents,
            pageViews,
            featureUsage,
            recentActivity
        ] = await Promise.all([
            Analytics.countDocuments({ userId }),
            Analytics.countDocuments({ userId, eventType: "page_view" }),
            Analytics.aggregate([
                { $match: { userId, eventType: "feature_use" } },
                { $group: { _id: "$action", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Analytics.find({ userId })
                .sort({ timestamp: -1 })
                .limit(20)
        ]);
        
        res.json({
            totalEvents,
            pageViews,
            featureUsage,
            recentActivity
        });
    } catch (error) {
        console.error('Analytics stats error:', error);
        res.status(500).json({ message: "Failed to fetch analytics" });
    }
});

// Get daily activity for charts
router.get("/daily-activity", async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const dailyStats = await Analytics.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
                    },
                    events: { $sum: 1 },
                    pageViews: { 
                        $sum: { 
                            $cond: { if: { $eq: ["$eventType", "page_view"] }, then: 1, else: 0 } 
                        } 
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        res.json(dailyStats);
    } catch (error) {
        console.error('Daily activity error:', error);
        res.status(500).json({ message: "Failed to fetch daily activity" });
    }
});

export default router;