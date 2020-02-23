var express 	= require("express"),
	router 		= express.Router(),
	Camp   		= require("../models/camp"),
	passport    = require("passport"),
	User		= require("../models/user");

router.get("/", function(req, res){
	res.render("home");
});

//AUTHENTICATION ROUTES
router.get("/login", function(req, res){
	res.render("login", {page: 'login'});	
});

router.post("/login", passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res){
	req.flash("success", "Welcome to Yelp Camp " + req.user.username);
	res.redirect("/campgrounds");
});

router.get("/signup", function(req, res){
	res.render("signup", {page: 'signup'});
});

router.post("/signup", function(req, res){
	User.register(new User({username: req.body.username}), req.body.password, function(err, user){
		if(err){
			req.flash("error", err.message);
			res.redirect("/signup")
		}else{
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "Welcome to Yelp Camp " + user.username);
				res.redirect("/campgrounds");
			});
		}
	});
});

router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged you out")
	res.redirect("/campgrounds");
});

module.exports = router;