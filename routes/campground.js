var express 	= require("express"),
	router 		= express.Router(),
	Camp   		= require("../models/camp"),
	middleware  = require("../middleware/index");

//INDEX
router.get("/", function(req, res){
	Camp.find({}, function(err, camps){
		if(err){
			req.redirect("/");
		}else{
			res.render("campground/campgrounds", {campList: camps, page: 'campgrounds'});
		}
	});
});

//NEW
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("campground/newCampground");
});

//CREATE
router.post("/", middleware.isLoggedIn, function(req, res){
	var newCamp = req.body.camp;
		newCamp.author = {id: req.user._id, username: req.user.username};
	Camp.create(newCamp, function(err, camp){
		if(err){
			console.log("database error");
		}else{
			res.redirect("/campgrounds");
		}
	});
});

//SHOW
router.get("/:id", function(req, res){
	Camp.findById(req.params.id).populate("comments").exec(function(err, camp){
		if(err || !camp){
			req.flash("error", "Campground not found");
			res.redirect("/campgrounds")
		}else{
			res.render("campground/showCampground", {camp: camp});
		}
	});
});

//EDIT
router.get("/:id/edit", middleware.hasCampAutherization, function(req, res){
	Camp.findById(req.params.id, function(err, foundCamp){
		res.render("campground/editCampground", {camp: foundCamp});
	});
});


//UPDATE
router.put("/:id", middleware.hasCampAutherization, function(req, res){
	Camp.findByIdAndUpdate(req.params.id, req.body.camp, function(err, updatedCamp){
		if(err){
			res.redirect("/campgrounds");
		}else{
			req.flash("success", "Camp Successfully Updated!");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//DESTORY
router.delete("/:id", middleware.hasCampAutherization, function(req, res){
	Camp.findByIdAndRemove(req.params.id, function(err){
		if(err){
			req.flash("error", "Something went wrong while attempting to delete the campground");
			res.redirect("/campgrounds/" + req.params.id);
		}
		req.flash("success", "Campground deleted successfully!");
		res.redirect("/campgrounds");
	});
});

module.exports = router;