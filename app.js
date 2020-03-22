 const express 					= require("express"),
	   app 						= express(),
	   bodyParser 				= require("body-parser"),
	   mongoose 				= require("mongoose"),
	   //SeedDB 				= require("./seed"),
	   User						= require("./models/user"),
	   LocalStrategy 			= require("passport-local"),
 	   passport 				= require("passport"),
	   indexRoutes				= require("./routes/index"),
	   commentRoutes			= require("./routes/comments"),
	   campgroundRoutes			= require("./routes/campgrounds"),
	   userRoutes				= require("./routes/users"),
	   methodOverride			= require("method-override"),
	   flash					= require("connect-flash");

//SeedDB();
require("dotenv").config();

mongoose.connect(process.env.DBURL, {
	useNewUrlParser: true, 
	useFindAndModify: false,
	useCreateIndex: true,
	useUnifiedTopology: true
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/public'));
app.use(flash());
app.set("view engine", "ejs");

app.use(require('express-session')({ secret: 'OnePlus7', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	res.locals.currentUser 	= req.user;
	res.locals.error 	    = req.flash("error");
	res.locals.success      = req.flash("success");
	res.locals.moment       = require("moment");
	next();
});

app.use("/", indexRoutes);
app.use("/users", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.listen(process.env.PORT, process.env.IP, () => {
	console.log("Server Online...");
});