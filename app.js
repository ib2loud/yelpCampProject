//This is yelpCamp!

//Declare plugins
const express = require("express"), //Set up express
    app = express(),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    session = require("express-session"),
    flash = require("connect-flash"),
    bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    fileUpload = require("express-fileupload"); //For image uploading

//Declare routes
const commentRoutes = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes = require("./routes"),
    Campground = require("./models/campground"),
    Comment = require("./models/comment"),
    User = require("./models/user");

//Live Server
mongoose.connect("mongodb+srv://bremy23:bremy23yelpcamp@cluster0-uqjcu.azure.mongodb.net/test?retryWrites=true", {
    useNewUrlParser: true
})

// //Local Server
// mongoose.connect("mongodb://localhost:27017/yelp_camp", {
//     useNewUrlParser: true
// });

mongoose.set("useFindAndModify", false);


//Set up file uploader
app.use(fileUpload({
    createParentPath: true
}));

app.use(methodOverride("_method")); //Allow FORM to PUT

//Set up body-parser
app.use(bodyParser.urlencoded({
    extended: true
}));

//Set up encoding
app.use(require("express-session")({
    secret: "Life is good",
    resave: false,
    saveUninitialized: false,
}));

//Set up flash
app.use(flash());

//Set up passport for user auth
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//Routes
app.use("/", indexRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use(express.static(__dirname + "/public")); //Set static folder for assets
app.set("view engine", "ejs"); //Set rendering image

// //Start Server
// app.listen(process.env.PORT || 5000);

//Start local server
app.listen(3000, 'localhost');
console.log("server started");
//Start local server