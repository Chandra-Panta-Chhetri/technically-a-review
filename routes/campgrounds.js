const express 	 = require("express"),
	  router 	 = express.Router(),
	  Camp   	 = require("../models/camp"),
	  middleware = require("../middleware/index");

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

router.get("/", async (req, res) => {
	var camps;
	try {
		if(req.query.search){
			const regex = new RegExp(escapeRegex(req.query.search), 'gi');
			camps = await Camp.find({$or: [{name: regex}, {"author.username":regex}]});
			return res.render("campground/campgrounds", {camps, page: 'campgrounds', searched: true});
		}
		camps = await Camp.find({});
		return res.render("campground/campgrounds", {camps, page: 'campgrounds', searched: false});
	} catch (e) {
		res.redirect("/");
	}
});

router.get("/new", middleware.isLoggedIn, (req, res) => res.render("campground/newCampground"));

router.post("/", middleware.isLoggedIn, async (req, res) => {
	try {
		await Camp.create({...req.body.camp, author: {id: req.user._id, username: req.user.username}});
		return res.redirect("/campgrounds");
	} catch (e) {
		req.flash("error", "Cannot create a camp at this time. Please try again later.");
		return res.redirect("/campgrounds");
	}
});

router.get("/:id", async (req, res) => {
	try {
		const camp = await Camp.findById(req.params.id).populate({
			path: "comments",
			options: {sort: {updatedAt: -1}}
		}).exec();
		if(!camp){
			throw new Error();
		}
		if(req.user){
			const hasCommented = await middleware.commentStatus(req.user.commentedCamps, req.params.id);
			return res.render("campground/showCampground", {camp, hasCommented});
		}
		return res.render("campground/showCampground", {camp, hasCommented: false});
	} catch (e) {
		req.flash("error", "Campground not found");
		return res.redirect("/campgrounds")
	}
});

router.get("/:id/edit", middleware.hasCampAuth, async (req, res) => {
	const camp = await Camp.findById(req.params.id);
	return res.render("campground/editCampground", {camp});
});

router.put("/:id", middleware.hasCampAuth, async (req, res) => {
	try {
		await Camp.findByIdAndUpdate(req.params.id, req.body.camp);
		req.flash("success", "Camp Successfully Updated!");
		return res.redirect(`/campgrounds/${req.params.id}`);
	} catch (e) {
		req.flash("error", "Cannot update at this time. Please try again later.");
		return res.redirect("/campgrounds");
	}
});

router.delete("/:id", middleware.hasCampAuth, async (req, res) => {
	try {
		const camp = await Camp.findById(req.params.id).populate("comments").exec();
		camp.remove();
		req.flash("success", "Campground deleted successfully!");
		return res.redirect("/campgrounds");
	} catch (e) {
		req.flash("error", "Cannot delete at this time. Please try again later.");
		res.redirect(`/campgrounds/${req.params.id}`);
	}
});

module.exports = router;