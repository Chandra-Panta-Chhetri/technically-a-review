 var express 					= require("express"),
	 app 						= express(),
	 bodyParser 				= require("body-parser"),
	 mongoose 					= require("mongoose"),
	 //SeedDB 					= require("./seed"),
	 User						= require("./models/user"),
	 LocalStrategy 				= require("passport-local"),
 	 passport 					= require("passport"),
	 passportLocalMongoose 		= require("passport-local-mongoose"),
	 indexRoutes				= require("./routes/index"),
	 commentRoutes				= require("./routes/comments"),
	 campgroungRoutes			= require("./routes/campground"),
	 methodOverride				= require("method-override"),
	 flash						= require("connect-flash");

//SeedDB();

//"mongodb://localhost:27017/camps"

mongoose.connect("mongodb+srv://chan:WimpyKid839@cluster0-ogvo5.mongodb.net/test?retryWrites=true&w=majority", {
	useNewUrlParser: true, 
	useFindAndModify: false,
	useCreateIndex: true,
	useUnifiedTopology: true
});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
app.use(flash());

//Authentication
app.use(require('express-session')({ secret: 'OnePlus7', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.user = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroungRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.listen(process.env.PORT, process.env.IP, function(){
	console.log("Server Online...");
});