
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Review = require("./models/Review"); // or review

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        status: "Online",
        message: "Portfolio Backend is Running 🚀",
        endpoints: {
            reviews: "/api/reviews"
        }
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok"
    });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));
//API
app.post("/api/reviews", async (req, res) => {

    console.log("POST REVIEW HIT");

    try {

        const {
            name,
            email,
            country,
            service,
            review: reviewText,
            rating,
            recommend
        } = req.body;

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email"
            });
        }

        const review = new Review({

            name,
            email,
            country,
            service,
            review: reviewText,
            rating,
            recommend,

            // These are controlled by the server
            verifiedClient: false,
            approved: false

        });

        await review.save();

        res.status(201).json({
            success: true,
            message: "Review submitted and is pending verification."
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Failed to save review"
        });

    }

});

app.get("/api/reviews", async (req, res) => {

    try {

        const reviews = await Review.find({
            verifiedClient: true,
            approved: true
        })
        .sort({ createdAt: -1 });

        res.json(reviews);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Failed to load reviews"
        });

    }

});



const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
