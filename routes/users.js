const TechProduct = require("../models/techProduct");
const User = require("../models/user");
const Review = require("../models/review");
const router = require("express").Router();
const middleware = require("../middleware");
const cloudinary = require("./configs/cloudinaryConfig");
const upload = require("./configs/multerConfig");
const mongoose = require("mongoose");

router.post(
  "/",
  middleware.isLoggedOut,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const password = req.body.newUser.password;
      req.body.newUser.isAdmin =
        req.body.newUser.code === process.env.ADMINCODE;
      delete req.body.newUser.code;
      delete req.body.newUser.password;
      const user = await User.register(req.body.newUser, password);
      const result = await cloudinary.uploader.upload(req.file.path, {
        public_id: user._id,
        eager: [{ width: 350, height: 250, crop: "scale", quality: "100" }]
      });
      user.avatarUrl = result.eager[0].secure_url;
      await user.save();
      req.login(user, () => {
        req.flash("success", `Welcome ${user.name}!`);
        return res.redirect("/techProducts");
      });
    } catch (e) {
      req.flash("error", e.message);
      return res.redirect("/signup");
    }
  },
  (err, req, res, next) => {
    req.flash("error", err);
    res.redirect("/signup");
  }
);

router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      throw new Error();
    }
    const usersTechProducts = await TechProduct.find({ "author.id": user._id });
    const numReviews = await Review.find({
      "author.id": user._id
    }).countDocuments();
    return res.render("user/show", { user, usersTechProducts, numReviews });
  } catch (e) {
    req.flash("error", "User does not exist.");
    return res.redirect("/techProducts");
  }
});

router.get(
  "/:userId/edit",
  middleware.isLoggedIn,
  middleware.canModifyProfile,
  async (req, res) => {
    const user = await User.findById(req.params.userId);
    return res.render("user/edit", { user });
  }
);

router.put(
  "/:userId",
  middleware.isLoggedIn,
  middleware.canModifyProfile,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      req.body.user.email = req.body.user.email.toLowerCase();
      if (req.file) {
        cloudinary.uploader.destroy(user._id);
        const result = await cloudinary.uploader.upload(req.file.path, {
          public_id: user._id,
          eager: [{ width: 350, height: 250, crop: "scale", quality: "100" }]
        });
        req.body.user.avatarUrl = result.eager[0].secure_url;
      }
      await user.updateOne({ $set: req.body.user });
      req.flash("success", "Profile successfully updated!");
    } catch (e) {
      req.flash(
        "error",
        "Profile update unsuccessful. Please try again later."
      );
    }
    return res.redirect(`/users/${req.params.userId}`);
  },
  (err, req, res, next) => {
    req.flash("error", err);
    res.redirect(`/users/${req.params.userId}/edit`);
  }
);

router.delete(
  "/:userId",
  middleware.isLoggedIn,
  middleware.canModifyProfile,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      cloudinary.uploader.destroy(user._id);
      await user.remove();
      req.flash("success", "Account has been closed successfully!");
      return res.redirect("/techProducts");
    } catch (e) {
      req.flash(
        "error",
        "Account deletion unsuccessful. Please try again later."
      );
      return res.redirect(`/users/${req.params.userId}`);
    }
  }
);

router.get(
  "/:userId/changePassword",
  middleware.isLoggedIn,
  middleware.hasGoogleAccount,
  middleware.canModifyProfile,
  (req, res) => res.render("user/changePassword", { userId: req.params.userId })
);

router.post(
  "/:userId/changePassword",
  middleware.isLoggedIn,
  middleware.hasGoogleAccount,
  middleware.canModifyProfile,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (req.body.newPass === req.body.confirmNewPass) {
        return user.changePassword(
          req.body.currentPass,
          req.body.newPass,
          (err) => {
            if (err) {
              req.flash("error", "Current password is wrong.");
              return res.redirect(`/users/${req.params.userId}/changePassword`);
            }
            req.flash("success", "Password has been successfully changed!");
            return res.redirect(`/users/${req.params.userId}`);
          }
        );
      }
      req.flash("error", "Please make sure passwords match.");
      return res.redirect(`/users/${req.params.userId}/changePassword`);
    } catch (e) {
      req.flash(
        "error",
        "Password change unsuccessful. Please try again later."
      );
      return res.redirect("/techProducts");
    }
  }
);

module.exports = router;
