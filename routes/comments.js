var express 	= require("express"),
	router 		= express.Router({mergeParams: true}),
	Camp   		= require("../models/camp"),
	Comment     = require("../models/comment"),
	middleware  = require("../middleware/index");

//NEW
router.get("/new", middleware.isLoggedIn, function(req, res){
	Camp.findOne({_id: req.params.id}, function(err, camp){
		if(err || !camp){
			req.flash("error", "Campground not found");
			res.redirect("/campgrounds");
		}else{
			res.render("comment/newComment", {camp: camp});
		}
	});
});

//CREATE
router.post("/", middleware.isLoggedIn, function(req, res){
	Camp.findById(req.params.id, function(err, camp){
		if(err || !camp){
			req.flash("error", "Campground not found");
			res.redirect("/campgrounds");
		}else{
			Comment.create(req.body.comment, function(err, comment){
				comment.author.id = req.user._id;
				comment.author.username = req.user.username;
				comment.save();
				camp.comments.push(comment);
				camp.save();
				res.redirect("/campgrounds/" + req.params.id);
			});
		}
	});
});

//EDIT
router.get("/:commentId/edit", middleware.hasCommentAutherization, function(req, res){
	Comment.findById(req.params.commentId, function(err, foundComment){
		res.render("comment/editComment", {campId: req.params.id, comment: foundComment});
	});
});

//UPDATE
router.put("/:commentId", middleware.hasCommentAutherization, function(req, res){
	Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, updatedComment){
		if(err){
			req.flash("error", "Comment not found");
			res.redirect("/campgrounds");
		}else{
			req.flash("success", "Comment Successfully Updated!");
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//DESTORY
router.delete("/:commentId", middleware.hasCommentAutherization, function(req, res){
	Comment.findByIdAndRemove(req.params.commentId, function(err){
		if(err){
			res.redirect("/campgrounds/" + req.params.id);
		}else{
			res.redirect("/campgrounds");
		}
	});
});

module.exports = router;