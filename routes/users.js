const express 	 = require("express"),
      router     = express.Router(),
      Camp       = require("../models/camp"),
      User       = require("../models/user"),
	  middleware = require("../middleware/index"),
	  cloudinary = require('./utils/cloudinaryConfig'),
	  upload     = require('./utils/multerConfig');

router.post("/", upload.single('avatar'), async (req, res) => {
	try {
		const userPassword = req.body.newUser.password;
		req.body.newUser.isAdmin = req.body.newUser.code === process.env.ADMINCODE;
		delete req.body.newUser.code;
		delete req.body.newUser.password;
		const result = await cloudinary.v2.uploader.upload(req.file.path);
		req.body.newUser.avatar = {id: result.public_id, url: result.secure_url};
		const user = await User.register(req.body.newUser, userPassword);
		req.logIn(user, (err) => {
			req.flash("success", `Welcome to Yelp Camp ${user.username}!`);
			return res.redirect("/campgrounds");
		});
	} catch (e) {
		req.flash("error", e.message);
		return res.redirect("/signup");
	}
}, (err, req, res, next) => {
	req.flash("error", err);
	res.redirect("/signup");
});

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


router.put("/:userId", middleware.isLoggedIn, middleware.hasProfileAuth, upload.single('avatar'), async (req, res) => {
	try {
		const user = await User.findById(req.params.userId);
		if(req.file){
			cloudinary.v2.uploader.destroy(user.avatar.id);
			const result = await cloudinary.v2.uploader.upload(req.file.path);
			req.body.user.avatar = {id: result.public_id, url: result.secure_url};
		}
		await user.updateOne({$set: req.body.user});
		req.flash("success", "Profile successfully updated!");
	} catch (e) {
		req.flash("error", "Cannot update user info at this time. Please try again later.");
	}
	return res.redirect(`/users/${req.params.userId}`);
}, (err, req, res, next) => {
	req.flash("error", err);
	res.redirect(`/users/${req.params.userId}/edit`);
});

router.delete("/:userId", middleware.isLoggedIn, middleware.hasProfileAuth, async(req, res) => {
	try {
		const user = await User.findById(req.params.userId);
		cloudinary.v2.uploader.destroy(user.avatar.id);
		user.remove();
		req.flash("success", "Account has been closed successfully!");
		return res.redirect("/campgrounds");
	} catch (e) {
		req.flash("error", "Cannot delete account at this time. Please try again later.");
		return res.redirect(`/users/${req.params.userId}`);
	}
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