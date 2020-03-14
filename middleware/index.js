var middleware = {},
	Camp 	   = require("../models/camp"),
	Comment    = require("../models/comment"),
	User	   = require("../models/user");

middleware.isLoggedIn = function(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in to do that!");
	res.redirect("/login");
}

middleware.hasCampAutherization = function(req, res, next){
	if(req.isAuthenticated()){
		Camp.findById(req.params.id, function(err, foundCamp){
			if(err || !foundCamp){
				req.flash("error", "Campground not found");
				res.redirect("/campgrounds");
			}
			else if(foundCamp.author.id.equals(req.user._id) || req.user.isAdmin){
				next();
			}else{
				req.flash("error", "You do not have permission to do that");
				res.redirect("/campgrounds/" + req.params.id);
			}
		});
	} else{
		req.flash("error", "You need to be logged in to do that");
		res.redirect("/login");
	}
}

middleware.hasCommentAutherization = function(req, res, next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.commentId, function(err, foundComment){
			if(err || !foundComment){
				req.flash("error", "Comment not found");
				res.redirect("back");
			}else{
				if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
					next();
				}else{
					req.flash("error", "You do not have permission to do that");
					res.redirect("back");
				}
			}
		});
	}else{
		req.flash("error", "You need to be logged in to do that");
		res.redirect("/login");
	}
}

middleware.hasProfileEditAuth = function(req, res, next){
	if(req.isAuthenticated()){
		User.findById(req.params.id, function(err, foundUser){
			if(err || !foundUser){
				req.flash("error", "User with provided id not found");
				return res.redirect("back");
			}
			if(foundUser._id.equals(req.user._id)){
				return next();
			}
			req.flash("error", "Only the account holder may edit their profile or change their password");
			res.redirect("/users/" + req.params.id);
		});
	}else{
		req.flash("error", "You need to be logged in to do that");
		res.redirect("/login");
	}
}
	
module.exports = middleware;