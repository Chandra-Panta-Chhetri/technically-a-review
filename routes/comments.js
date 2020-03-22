const express 	  = require("express"),
	  router 	  = express.Router({mergeParams: true}),
	  Camp   	  = require("../models/camp"),
	  Comment     = require("../models/comment"),
	  middleware  = require("../middleware/index");

router.get("/new", middleware.isLoggedIn, middleware.hasCommented, async (req, res) => {
	try {
		const camp = await Camp.findById(req.params.id);
		if(!camp){
			throw new Error();
		}
		return res.render("comment/newComment", {camp});
	} catch (e) {
		req.flash("error", "Campground not found");
		return res.redirect("/campgrounds");
	}
});

router.post("/", middleware.isLoggedIn, middleware.hasCommented, async (req, res) => {
	try {
		const camp = await Camp.findById(req.params.id);
		if(!camp){
			throw new Error();
		}
		const comment = await Comment.create(req.body.comment);
		comment.author.id = req.user._id;
		comment.author.username = req.user.username;
		await comment.save();
		camp.comments.push(comment);
		await camp.save();
		req.user.commentedCamps.push(req.params.id);
		await req.user.save();
		return res.redirect("/campgrounds/" + req.params.id);
	} catch (e) {
		req.flash("error", "Campground not found");
		return res.redirect("/campgrounds");
	}
});

router.get("/:commentId/edit", middleware.hasCommentAuth, async (req, res) => {
	const comment = await Comment.findById(req.params.commentId);
	return res.render("comment/editComment", {campId: req.params.id, comment});
});

router.put("/:commentId", middleware.hasCommentAuth, async (req, res) => {
	try {
		const updatedComment = await Comment.findByIdAndUpdate(req.params.commentId, req.body.comment);
		if(!updatedComment){
			throw new Error();
		}
		req.flash("success", "Comment Successfully Updated!");
		return res.redirect("/campgrounds/" + req.params.id);
	} catch (e) {
		req.flash("error", "Cannot update at this time. Please try again later.");
		return res.redirect("/campgrounds");
	}
});

router.delete("/:commentId", middleware.hasCommentAuth, async (req, res) => {
	try {
		const camp = await Camp.findById(req.params.id);
		if(!camp){
			throw new Error();
		}
		await Comment.findByIdAndRemove(req.params.commentId);
		req.user.commentedCamps = req.user.commentedCamps.filter((campId) => !campId.equals(req.params.id));
		camp.comments = camp.comments.filter((comment) => !comment.equals(req.params.commentId));
		await camp.save();
		await req.user.save();
		req.flash("success", "Comment was successfully deleted!");
		return res.redirect(`/campgrounds/${req.params.id}`);
	} catch (e) {
		req.flash("error", "Camp not found.");
		return res.redirect("/campgrounds/" + req.params.id);
	}
});

module.exports = router;