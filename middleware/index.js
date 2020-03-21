const middleware = {},
	  Camp 	     = require("../models/camp"),
	  Comment    = require("../models/comment"),
	  User	     = require("../models/user");

middleware.isLoggedIn = (req, res, next) => {
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in to do that!");
	res.redirect("/login");
}

middleware.hasCampAuth = async (req, res, next) => {
	if(req.isAuthenticated()){
		try {
			const camp = await Camp.findById(req.params.id);
			if(!camp){
				throw new Error();
			}else if(camp.author.id.equals(req.user._id) || req.user.isAdmin){
				return next();
			}
			req.flash("error", "You do not have permission to do that");
			return res.redirect("/campgrounds/" + req.params.id);
		} catch (e) {
			req.flash("error", "Campground not found");
			return res.redirect("/campgrounds");
		}
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
}

middleware.hasCommentAuth = async (req, res, next) =>{
	if(req.isAuthenticated()){
		try {
			const comment = await Comment.findById(req.params.commentId);
			if(!comment){
				throw new Error();
			}else if(comment.author.id.equals(req.user._id) || req.user.isAdmin){
				return next();
			}
			req.flash("error", "You do not have permission to do that");
			return res.redirect("back");
		} catch (e) {
			req.flash("error", "Comment not found");
			return res.redirect("back");
		}
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
}

middleware.hasProfileAuth = async (req, res, next) => {
	if(req.isAuthenticated()){
		try {
			const user = await User.findById(req.params.id);
			if(!user){
				throw new Error();
			}else if(user._id.equals(req.user._id)){
				return next();
			}
			req.flash("error", "Only the account holder may edit their profile or change their password");
			return res.redirect("/users/" + req.params.id);
		} catch (e) {
			req.flash("error", "User not found");
			return res.redirect("/campgrounds");
		}
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
}
	
module.exports = middleware;