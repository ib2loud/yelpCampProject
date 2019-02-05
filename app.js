//This is yelpCamp!
const express = require("express"), //Set up express
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    methodOverride = require("method-override"),
    expressSanitizer = require("express-sanitizer"),
    fileUpload = require("express-fileupload"),
    fs = require("fs"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment"),
    rimraf = require("rimraf"), //To delete random folder
    randomize = require("randomatic"); //To create random folder for image

//Live Server
mongoose.connect("mongodb+srv://bremy23:bremy23yelpcamp@cluster0-uqjcu.azure.mongodb.net/test?retryWrites=true", {
    useNewUrlParser: true
})

//Local Server
// mongoose.connect("mongodb://localhost:27017/yelp_camp", {
//     useNewUrlParser: true
// });

mongoose.set("useFindAndModify", false);
app.use(fileUpload({
    createParentPath: true
})); //Set up file uploader

app.use(methodOverride("_method")); //Allow FORM to PUT
app.use(bodyParser.urlencoded({
    extended: true
})); //Set up body-parser

app.use(express.static(__dirname + "/public")); //Set static folder for assets
app.set("view engine", "ejs"); //Set rendering image
app.use(expressSanitizer()); //prevent HTML in input

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
app.get("/campgrounds/new", (req, res) => {
    res.render("campground/new.ejs");
});

//Create new campground - CREATE
app.post("/campgrounds", (req, res) => {
    let randomFolder = randomize("Aa0", 15);
    if (Object.keys(req.files).length == 0) {
        tempImage = "tent.png";
    } else {
        let uploadPath = `public/files/${randomFolder}/${req.files.image.name}`;
        req.files.image.mv(uploadPath, (err) => {
            if (err) console.log("error moving file");
        });
        tempImage = `${randomFolder}/${req.files.image.name}`;
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
    //Delete Image Folder
    Campground.findById(req.params.id, (err, foundCampground) => {
        rimraf(`public/files/${foundCampground.randomFolder}`, (err) => {
            if (err) console.log(err);
        });
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