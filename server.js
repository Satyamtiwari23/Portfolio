require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Review = require("./models/Review"); // or review

const app = express();

app.use(cors());
app.use(express.json());


mongoose.connect(
  "mongodb+srv://sttiwari9211_db_user:YOUR_PASSWORD@cluster0.zi5ta2x.mongodb.net/portfolioDB?retryWrites=true&w=majority&appName=Cluster0"
)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));
//API
app.post("/api/reviews", async (req, res) => {

    console.log("POST REVIEW HIT");

    try {

        const { email } = req.body;

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email"
            });
        }

        const review = new Review(req.body);

        await review.save();

        res.status(201).json({
            success: true,
            message: "Review Saved"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false
        });

    }

});

app.get("/api/reviews", async (req, res) => {

    const reviews = await Review.find({})
        .sort({ createdAt: -1 });

    res.json(reviews);

});

app.listen(8000, () => {
    console.log("Server running on port 8000");
});


