const express 	  = require("express"),
	  router 	  = express.Router({mergeParams: true}),
	  Camp   	  = require("../models/camp"),
	  Comment     = require("../models/comment"),
	  middleware  = require("../middleware/index");

function calculateAvgRating(comments){
	if(!comments.length){
		return 0;
	}
	var totalRating = 0;
	comments.forEach((comment) => {
		totalRating += comment.rating;
	});
	return Math.ceil(totalRating / comments.length);
}

router.get("/new", middleware.isLoggedIn, middleware.hasCommented, async (req, res) => {
	try {
		const camp = await Camp.findById(req.params.campId);
		if(!camp){
			throw new Error();
		}
		return res.render("comment/new", {camp});
	} catch (e) {
		req.flash("error", "Campground not found");
		return res.redirect("/campgrounds");
	}
});

router.post("/", middleware.isLoggedIn, middleware.hasCommented, async (req, res) => {
	try {
		const camp = await Camp.findById(req.params.campId);
		if(!camp){
			throw new Error();
		}
		const comment = await Comment.create(req.body.comment);
		comment.author = {id: req.user._id, username: req.user.username};
		comment.campId = camp._id;
		await comment.save();
		const campComments = await Comment.find({campId: camp._id});
		camp.avgRating = calculateAvgRating(campComments);
		await camp.save();
		return res.redirect(`/campgrounds/${req.params.campId}`);
	} catch (e) {
		req.flash("error", "No campground found.");
		return res.redirect("/campgrounds");
	}
});

router.get("/:commentId/edit", middleware.isLoggedIn, middleware.hasCommentAuth, async (req, res) => {
	const comment = await Comment.findById(req.params.commentId);
	return res.render("comment/edit", {campId: req.params.campId, comment});
});

router.put("/:commentId", middleware.isLoggedIn, middleware.hasCommentAuth, async (req, res) => {
	try {
		await Comment.findByIdAndUpdate(req.params.commentId, req.body.comment);
		const camp           = await Camp.findById(req.params.campId),
		      campComments   = await Comment.find({campId: camp._id});
		if(!campComments.length || !camp){
			throw new Error();
		}
		camp.avgRating = calculateAvgRating(campComments);
		await camp.save();
		req.flash("success", "Comment successfully updated!");
		return res.redirect(`/campgrounds/${req.params.campId}`);
	} catch (e) {
		req.flash("error", "Cannot update comment at this time. Please try again later.");
		return res.redirect("/campgrounds");
	}
});

router.delete("/:commentId", middleware.isLoggedIn, middleware.hasCommentAuth, async (req, res) => {
	try {
		await Comment.findByIdAndRemove(req.params.commentId);
		const camp		   = await Camp.findById(req.params.campId),
		      campComments = await Comment.find({campId: camp._id});
		if(!camp){
			throw new Error();
		}
		camp.avgRating = calculateAvgRating(campComments);
		await camp.save();
		req.flash("success", "Comment was successfully deleted!");
	} catch (e) {
		console.log(e);
		req.flash("error", "Cannot delete comment. Please try again later.");
	}
	return res.redirect(`/campgrounds/${req.params.campId}`);
});

module.exports = router;