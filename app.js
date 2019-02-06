//This is yelpCamp!
const express = require("express"), //Set up express
    app = express(),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    User = require("./models/user"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    methodOverride = require("method-override"),
    expressSanitizer = require("express-sanitizer"),
    fileUpload = require("express-fileupload"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment"),
    Toast = require("universal-toast"), //Toasts
    Jimp = require("jimp"), //Creating thumbnails for index
    rimraf = require("rimraf"), //To delete random folder
    randomize = require("randomatic"); //To create random folder for image

// //Live Server
// mongoose.connect("mongodb+srv://bremy23:bremy23yelpcamp@cluster0-uqjcu.azure.mongodb.net/test?retryWrites=true", {
//     useNewUrlParser: true
// })

//Local Server
mongoose.connect("mongodb://localhost:27017/yelp_camp", {
    useNewUrlParser: true
});

mongoose.set("useFindAndModify", false);

//Set up file uploader
app.use(fileUpload({
    createParentPath: true
}));

//Set up encoding
app.use(require("express-session")({
    secret: "Life is good",
    resave: false,
    saveUninitialized: false
}));

app.use(methodOverride("_method")); //Allow FORM to PUT

//Set up body-parser
app.use(bodyParser.urlencoded({
    extended: true
}));

//Set up passport for user auth
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(express.static(__dirname + "/public")); //Set static folder for assets
app.set("view engine", "ejs"); //Set rendering image
app.use(expressSanitizer()); //prevent HTML in input

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
};

//======================
// ROUTES
//======================

//Home page
app.get("/", (req, res) => {
    res.render("landing");
});

//Show all campgrounds - INDEX
app.get("/campgrounds", (req, res) => {
    //Get all camps from db
    Campground.find({}, (err, allCampgrounds) => {
        if (err) {
            console.log(err)
        } else {
            res.render("campground/index", {
                campgrounds: allCampgrounds
            });
        }
    });
});

//Creation form - NEW
app.get("/campgrounds/new", isLoggedIn, (req, res) => {
    res.render("campground/new");
});

//Registration Routes
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
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
app.get("/login", (req, res) => {
    res.render("login");
});
app.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/register"
}), (req, res) => {});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

//Create new campground - CREATE
app.post("/campgrounds", (req, res) => {
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
app.get("/campgrounds/:id", (req, res) => {
    Campground.findById(req.params.id).populate("comments").exec((err, foundCampground) => {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            foundCampground.views++;
            foundCampground.save();
            res.render("campground/show", {
                campground: foundCampground
            });
        };
    });
});

//Edit a campground - EDIT
app.get("/campgrounds/:id/edit", (req, res) => {
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
app.put("/campgrounds/:id", (req, res) => {
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
app.delete("/campgrounds/:id", (req, res) => {
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

//Comments
app.get("/campgrounds/:id/comments/new", (req, res) => {
    Campground.findById(req.params.id, (err, campground) => {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", {
                campground: campground
            });
        }
    });
});

app.post("/campgrounds/:id/comments", (req, res) => {
    Campground.findById(req.params.id, (err, campground) => {
        if (err) {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            Comment.create(req.body.comment, (err, comment) => {
                if (err) {
                    console.log(err);
                } else {
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect(`/campgrounds/${campground._id}`);
                }
            });
        }
    });
});

//Start local server
app.listen(3000, 'localhost');
console.log("server started");
//Start local server