const express 	 = require("express"),
      router     = express.Router(),
      Camp       = require("../models/camp"),
      User       = require("../models/user"),
      middleware = require("../middleware/index");

router.get("/:id", async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if(!user){
			throw new Error();
		}
		const usersCamps = await Camp.find({"author.id": user._id});
		return res.render("user/userInfo", {campCreator: user, usersCamps});
	} catch (e) {
		req.flash("error", "User not found");
		return res.redirect("/campgrounds");
	}
});

router.get("/:id/edit", middleware.hasProfileAuth, async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if(!user){
			throw new Error();
		}
		return res.render("user/editProfile", {user});
	} catch (e) {
		req.flash("error", "User not found.");
		return res.redirect("back");
	}
});


router.put("/:id", middleware.hasProfileAuth, async (req, res) => {
	try {
		const updatedUser = await User.findOneAndUpdate({_id: req.params.id}, {$set: 
			{
				fullName: req.body.name, 
				email: req.body.email, 
				avatar: req.body.avatar
			}});
		req.flash("success", "User info successfully updated!");
		return res.redirect("/users/" + req.params.id);
	} catch (e) {
		req.flash("error", "Cannot update user info at this time. Please try again later.");
		return res.redirect("/user/" + req.params.id);
	}
});

router.get("/:id/changePassword", middleware.hasProfileAuth, (req, res) => res.render("user/changePassword", {userId: req.params.id}));

router.post("/:id/changePassword", middleware.hasProfileAuth, async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if(!user){
			throw new Error();
		}
		if(req.body.newPass === req.body.confirmNewPass){
			return user.changePassword(req.body.currentPass, req.body.newPass, (err) => {
				if(err){
					req.flash("error", "Current password is wrong");
					return res.redirect("/users/" + req.params.id + "/changePassword");
				}
				req.flash("success", "Password has been succesfully changed");
				res.redirect("/users/" + req.params.id);
			});
		}
		req.flash("error", "Please make sure passwords match");
		return res.redirect("/users/" + req.params.id + "/changePassword");
	} catch (e) {
		req.flash("error", "User not found.");
		return res.redirect("/campgrounds");
	}
});

module.exports = router;