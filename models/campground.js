const mongoose = require("mongoose");

let campgroundSchema = new mongoose.Schema({
    owner: String,
    name: String,
    location: String,
    price: String,
    information: String,
    image: Object,
    date: {
        type: Date,
        default: Date.now
    },
    rating: {
        type: Number,
        default: 0
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    views: {
        type: Number,
        default: 0
    },
    randomFolder: String
});
module.exports = mongoose.model("Campground", campgroundSchema);