const express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    User = require("../models/user");

//Home page
router.get("/", (req, res) => {
    res.render("landing");
});


//Registration Routes
router.get("/register", (req, res) => {
    res.render("register");
});

router.post("/register", (req, res) => {
    User.register(new User({
        username: req.body.username
    }), req.body.password, (err, user) => {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("register");
        }
        passport.authenticate("local")(req, res, () => {
            req.flash("success", `Hello ${req.body.username}! Welcome to yelpCamp!`);
            res.redirect("/campgrounds");
        });
    });
});

//Login / Logout Routes
router.get("/login", (req, res) => {
    res.render("login");
});
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    successFlash: "Welcome Back",
    failureRedirect: "/login",
    failureFlash: true
}), (req, res) => {});

router.get("/logout", (req, res) => {
    user = req.user.username;
    req.logout();
    req.flash("success", `Logged out ${user}. See you soon!`);
    res.redirect("/");
});

module.exports = router;