const express 	 = require("express"),
      router     = express.Router(),
      Camp       = require("../models/camp"),
      User       = require("../models/user"),
      middleware = require("../middleware/index");

router.get("/:userId", async (req, res) => {
	try {
		const user = await User.findById(req.params.userId);
		if(!user){
			throw new Error();
		}
		const usersCamps = await Camp.find({"author.id": user._id});
		return res.render("user/show", {campCreator: user, usersCamps});
	} catch (e) {
		req.flash("error", "No user found");
		return res.redirect("/campgrounds");
	}
});

router.get("/:userId/edit", middleware.isLoggedIn, middleware.hasProfileAuth, async (req, res) => {
	const user = await User.findById(req.params.userId);
	return res.render("user/edit", {user});
});


router.put("/:userId", middleware.isLoggedIn, middleware.hasProfileAuth, async (req, res) => {
	try {
		await User.findByIdAndUpdate(req.params.userId, {$set: 
			{
				fullName: req.body.name, 
				email: req.body.email, 
				avatar: req.body.avatar
			}});
		req.flash("success", "User info successfully updated!");
	} catch (e) {
		req.flash("error", "Cannot update user info at this time. Please try again later.");
	}
	return res.redirect(`/users/${req.params.userId}`);
});

router.get("/:userId/changePassword", middleware.isLoggedIn, middleware.hasProfileAuth, (req, res) => res.render("user/changePassword", {userId: req.params.userId}));

router.post("/:userId/changePassword", middleware.isLoggedIn, middleware.hasProfileAuth, async (req, res) => {
	try {
		const user = await User.findById(req.params.userId);
		if(req.body.newPass === req.body.confirmNewPass){
			return user.changePassword(req.body.currentPass, req.body.newPass, (err) => {
				if(err){
					req.flash("error", "The current password you entered was wrong.");
					return res.redirect(`/users/${req.params.userId}/changePassword`);
				}
				req.flash("success", "Password has been succesfully changed");
				return res.redirect(`/users/${req.params.userId}`);
			});
		}
		req.flash("error", "Please make sure passwords match");
		return res.redirect(`/users/${req.params.userId}/changePassword`);
	} catch (e) {
		req.flash("error", "No, user found.");
		return res.redirect("/campgrounds");
	}
});

module.exports = router;