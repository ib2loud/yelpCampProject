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
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, () => {
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
    failureRedirect: "/register"
}), (req, res) => {});

router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

module.exports = router;