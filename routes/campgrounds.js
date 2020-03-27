const express 	 = require("express"),
	  router 	 = express.Router(),
	  Camp   	 = require("../models/camp"),
	  Comment    = require("../models/comment"),
	  middleware = require("../middleware/index");

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

router.get("/", async (req, res) => {
	var camps;
	try {
		if(req.query.search){
			const regex = new RegExp(escapeRegex(req.query.search), 'gi');
			camps = await Camp.find({$or: [{name: regex}, {"author.username": regex}]});
			return res.render("campground/index", {camps, page: 'campgrounds', searched: true});
		}
		camps = await Camp.find({});
		for(const camp of camps){
			await camp.populate("comments").execPopulate();
		}
		return res.render("campground/index", {camps, page: 'campgrounds', searched: false});
	} catch (e) {
		res.redirect("/");
	}
});

router.get("/new", middleware.isLoggedIn, (req, res) => res.render("campground/new"));

router.post("/", middleware.isLoggedIn, async (req, res) => {
	try {
		await Camp.create({...req.body.camp, author: {id: req.user._id, username: req.user.username}});
	} catch (e) {
		req.flash("error", "Cannot create a camp at this time. Please try again later.");
	}
	return res.redirect("/campgrounds");
});

router.get("/:campId", async (req, res) => {
	try {
		const comments = await Comment.find({campId: req.params.campId});
		const camp = await Camp.findById(req.params.campId);
		if(!camp){
			throw new Error();
		}
		if(req.user){
			const comment = await middleware.commentStatus(req.user._id, req.params.campId);
			return res.render("campground/show", {camp, comments, commentId: comment === null ? -1 : comment._id});
		}
		return res.render("campground/showCampground", {camp, comments, commentId: -1});
	} catch (e) {
		req.flash("error", "Sorry, no campground found.");
		return res.redirect("/campgrounds")
	}
});

router.get("/:campId/edit", middleware.isLoggedIn, middleware.hasCampAuth, async (req, res) => {
	const camp = await Camp.findById(req.params.campId);
	return res.render("campground/edit", {camp});
});

router.put("/:campId", middleware.isLoggedIn, middleware.hasCampAuth, async (req, res) => {
	try {
		await Camp.findByIdAndUpdate(req.params.campId, req.body.camp);
		req.flash("success", "Camp Successfully Updated!");
		return res.redirect(`/campgrounds/${req.params.campId}`);
	} catch (e) {
		req.flash("error", "Cannot update at this time. Please try again later.");
		return res.redirect("/campgrounds");
	}
});

router.delete("/:campId", middleware.isLoggedIn, middleware.hasCampAuth, async (req, res) => {
	try {
		const camp = await Camp.findById(req.params.campId);
		camp.remove();
		req.flash("success", "Campground deleted successfully!");
		return res.redirect("/campgrounds");
	} catch (e) {
		req.flash("error", "Cannot delete at this time. Please try again later.");
		res.redirect(`/campgrounds/${req.params.campId}`);
	}
});

module.exports = router;