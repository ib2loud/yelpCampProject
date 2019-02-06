const express = require("express"),
    router = express.Router(),
    Campground = require("../models/campground"),
    randomize = require("randomatic"), //To create random folder for image
    expressSanitizer = require("express-sanitizer"),
    Jimp = require("jimp"), //Creating thumbnails for index
    rimraf = require("rimraf"); //To delete random folder

router.use(expressSanitizer()); //prevent HTML in input

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
};

//Show all campgrounds - INDEX
router.get("/", (req, res) => {
    //Get all camps from db
    Campground.find({}, (err, allCampgrounds) => {
        if (err) {
            console.log(err)
        } else {
            res.render("campground/index", {
                campgrounds: allCampgrounds,
            });
        }
    });
});

//Creation form - NEW
router.get("/new", isLoggedIn, (req, res) => {
    res.render("campground/new");
});
//Create new campground - CREATE
router.post("/", (req, res) => {
    let randomFolder = randomize("Aa0", 15);
    if (Object.keys(req.files).length == 0) {
        randomFolder = "/icons/";
        tempImage = "tent.png";
    } else {
        tempImage = `${req.files.image.name}`;
        let uploadPath = `public/files/${randomFolder}/${tempImage}`;
        req.files.image.mv(uploadPath, (err) => {
            if (err) console.log("error moving file");
        });
        Jimp.read(uploadPath, (err, image) => {
            if (err) console.log(err);
            image
                .scaleToFit(2048, 2048)
                .write(uploadPath);
            image
                .scaleToFit(640, 640)
                .write(`public/files/${randomFolder}/thumb_${tempImage}`);
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
            res.redirect("/campgrounds");
        }
    });
});

//Show more information - SHOW
router.get("/:id", (req, res) => {
    Campground.findById(req.params.id).populate("comments").exec((err, foundCampground) => {
        if (err) {
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
            res.redirect(`/campgrounds/${req.params.id}`);
        }
    });
});

//Delete a campground - DESTROY
router.delete("/:id", (req, res) => {
    //Delete Image Folder unless it's in the icons folder
    Campground.findById(req.params.id, (err, foundCampground) => {
        if (foundCampground.randomFolder !== "/icons/") {
            rimraf(`public/files/${foundCampground.randomFolder}`, (err) => {
                if (err) console.log(err);
            });
        }
    });

    //Delete Database Entry
    Campground.findOneAndDelete({
        _id: req.params.id,
    }, (err) => {
        res.redirect("/campgrounds");
    });
});

module.exports = router;