const express = require("express"),
    router = express.Router(),
    middleware = require("../middleware"),
    Campground = require("../models/campground"),
    Comment = require("../models/comment"),
    randomize = require("randomatic"), //To create random folder for image
    expressSanitizer = require("express-sanitizer"),
    Jimp = require("jimp"), //Creating thumbnails for index
    rimraf = require("rimraf"), //To delete random folder
    User = require("../models/user");

router.use(expressSanitizer()); //prevent HTML in input

//Show all campgrounds - INDEX
router.get("/", (req, res) => {
    //Get all camps from db
    Campground.find({}, (err, allCampgrounds) => {
        if (err) {
            req.flash("error", "Something went wrong!");
            console.log(err)
        } else {
            res.render("campground/index", {
                campgrounds: allCampgrounds,
            });

        }
    });
});

//Creation form - NEW
router.get("/new", middleware.isLoggedIn, (req, res) => {
    res.render("campground/new");
});
//Create new campground - CREATE
router.post("/", middleware.isLoggedIn, (req, res) => {
    let randomFolder = randomize("Aa0", 15); //Create radom folder to prevent image duplicates
    if (Object.keys(req.files).length == 0) { //Show default image if none is uploaded
        randomFolder = "/icons/";
        tempImage = "tent.png";
    } else {
        tempImage = `${req.files.image.name}`;
        let uploadPath = `public/files/${randomFolder}/${tempImage}`;
        req.files.image.mv(uploadPath, (err) => {
            if (err) console.log("error moving file");
        });
        setTimeout(() => {}, 2500); //Slight delay so images can be in the right spot for resizing
        Jimp.read(uploadPath, (err, image) => {
            if (err) {
                console.log(err);
            } else {
                image
                    .scaleToFit(1200, 1200)
                    .write(uploadPath);
                image
                    .scaleToFit(640, 640)
                    .write(`public/files/${randomFolder}/thumb_${tempImage}`);
            }
        });
    }
    let numViews = 0;
    req.body.information = req.sanitize(req.body.information); //Prevent HTML
    let newCampground = {
        owner: req.user.username,
        name: req.body.name,
        location: req.body.location,
        price: req.body.price,
        information: req.body.information,
        image: tempImage,
        views: numViews,
        randomFolder: randomFolder
    };
    Campground.create(newCampground, (err, newCampground) => {
        if (err) {
            console.log(err);
        } else {
            req.flash("success", "Created Successfully!")
            res.redirect("/campgrounds");
        }
    });
});

//Show more information - SHOW
router.get("/:id", (req, res) => {
    Campground.findById(req.params.id).populate("comments").exec((err, foundCampground) => {
        if (err) {
            req.flash("error", "Something went wrong!");
            res.redirect("/campgrounds");
        } else {
            foundCampground.views++;
            foundCampground.save();
            res.render("campground/show", {
                campground: foundCampground,
            });
        };
    });
});

//Edit a campground - EDIT
router.get("/:id/edit", (req, res) => {
    Campground.findById(req.params.id, (err, foundCampground) => {
        if (err) {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            res.render("campground/edit", {
                campground: foundCampground
            });
        };
    });
});

//Update campground - UPDATE
router.put("/:id", (req, res) => {
    Campground.findOneAndUpdate({
        _id: req.params.id
    }, req.body, (err, updatedCampground) => {
        if (err) {
            console.log(err);
        } else {
            req.flash("success", "Edited Successfully!");
            res.redirect(`/campgrounds/${req.params.id}`);
        }
    });
});

//Delete a campground - DESTROY
router.delete("/:id", middleware.isLoggedIn, (req, res) => {
    Campground.findById(req.params.id, (err, foundCampground) => {
        //Check to see user is owner
        if (foundCampground.owner == req.user.username || req.user.username == "Brad") {
            //Delete Image Folder unless it's the icons folder
            if (foundCampground.randomFolder !== "/icons/") {
                rimraf(`public/files/${foundCampground.randomFolder}`, (err) => {
                    if (err) console.log(err);
                });
            }
            //Delete Comments
            if (foundCampground.comments.length > 0) {
                foundCampground.comments.forEach((comment) => {
                    Comment.findOneAndDelete({
                        _id: comment._id,
                    }, (err) => {

                    });
                });
            }
            //Delete Database Entry
            Campground.findOneAndDelete({
                _id: req.params.id,
            }, (err) => {
                req.flash("success", "Deleted Successfully!")
                res.redirect("/campgrounds");
            });
        } else {
            res.send("You shouldn't be here.");
        }
    });
});

module.exports = router;