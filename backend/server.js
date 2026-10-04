require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});
console.log(
    "MONGO_URI loaded:",
    !!process.env.MONGO_URI
);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Review = require("./models/Review");

const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// MONGODB CONNECTION
// ===============================

let cached = global.mongoConnection;

if (!cached) {
    cached = global.mongoConnection = {
        conn: null,
        promise: null
    };
}

async function connectDB() {

    // Already connected
    if (
        cached.conn &&
        mongoose.connection.readyState === 1
    ) {
        return cached.conn;
    }

    // Connection is already being established
    if (!cached.promise) {

        cached.promise = mongoose.connect(
            process.env.MONGO_URI,
            {
                serverSelectionTimeoutMS: 5000,
                maxPoolSize: 10
            }
        );
    }

    try {

        cached.conn = await cached.promise;

        console.log("MongoDB Connected");

        return cached.conn;

    } catch (error) {

        cached.promise = null;

        console.error(
            "MongoDB Connection Error:",
            error
        );

        throw error;
    }
}


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {

    res.json({
        status: "Online",
        message: "Portfolio Backend is Running 🚀",
        endpoints: {
            reviews: "/api/reviews"
        }
    });

});


// ===============================
// HEALTH
// ===============================

app.get("/health", async (req, res) => {

    try {

        await connectDB();

        res.status(200).json({
            status: "ok",
            database: "connected"
        });

    } catch (error) {

        console.error("Health Check Error:", error);

        res.status(500).json({
            status: "error",
            database: "disconnected"
        });

    }

});


// ===============================
// SUBMIT REVIEW
// ===============================

app.post("/api/reviews", async (req, res) => {

    console.log("POST REVIEW HIT");

    try {

        // IMPORTANT:
        // Connect before using MongoDB
        await connectDB();


        const {
            name,
            email,
            country,
            service,
            review: reviewText,
            rating,
            recommend
        } = req.body;


        // ===============================
        // EMAIL VALIDATION
        // ===============================

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(email)) {

            return res.status(400).json({
                success: false,
                message: "Invalid Email"
            });

        }


        // ===============================
        // CREATE REVIEW
        // ===============================

        const review = new Review({

            name,
            email,
            country,
            service,
            review: reviewText,
            rating,
            recommend,

            // IMPORTANT:
            // New reviews are NOT automatically verified
            verifiedClient: false,

            // IMPORTANT:
            // New reviews are NOT automatically approved
            approved: false

        });


        await review.save();


        // ===============================
        // RESPONSE
        // ===============================

        res.status(201).json({

            success: true,

            message:
                "Review submitted and is pending verification."

        });

    } catch (err) {

        console.error(
            "POST REVIEW ERROR:",
            err
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to save review"

        });

    }

});


// ===============================
// GET VERIFIED REVIEWS
// ===============================

app.get("/api/reviews", async (req, res) => {

    try {

        // IMPORTANT:
        // Make sure MongoDB is connected
        await connectDB();


        const reviews = await Review.find({

            verifiedClient: true,

            approved: true

        })
        .sort({
            createdAt: -1
        });


        res.status(200).json(reviews);

    } catch (err) {

        console.error(
            "GET REVIEWS ERROR:",
            err
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to load reviews"

        });

    }

});


// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});