const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({

    name: String,

    email: {
        type: String,
        required: true
    },

    country: String,

    service: String,

    review: String,

    rating: Number,

    recommend: String,

    approved: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports =
    mongoose.model("Review", reviewSchema);