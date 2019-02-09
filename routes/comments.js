const express = require("express"),
    router = express.Router({
        mergeParams: true
    }),
    Campground = require("../models/campground"),
    middleware = require("../middleware"),
    Comment = require("../models/comment.js");

router.post("/", middleware.isLoggedIn, (req, res) => {
    Campground.findById(req.params.id, (err, campground) => {
        if (err) {
            req.flash("error", "Something went wrong!");
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            req.body.comment.author = req.user.username;
            Comment.create(req.body.comment, (err, comment) => {
                if (err) {
                    req.flash("error", "Something went wrong!");
                    console.log(err);
                } else {
                    campground.comments.push(comment);
                    campground.save();
                    req.flash("success", "Comment Added!");
                    res.redirect(`/campgrounds/${campground._id}`);
                }
            });
        }
    });
});

module.exports = router;