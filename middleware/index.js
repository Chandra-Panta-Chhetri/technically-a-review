var middleware = {},
	Camp 	   = require("../models/camp"),
	Comment    = require("../models/comment");

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
	
module.exports = middleware;