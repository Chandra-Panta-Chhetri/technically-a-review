const middleware = {};
const TechProduct = require("../models/techProduct");
const Review = require("../models/review");
const User = require("../models/user");

middleware.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "Please login before you continue.");
  res.redirect("/login");
};

middleware.hasLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "Please logout before you do that.");
  res.redirect("/techProducts");
};

middleware.hasGoogleAccount = (req, res, next) => {
  if (req.user.googleId === "-1") {
    return next();
  }
  req.flash(
    "error",
    "You cannot change your password as you've signed in through Google."
  );
  res.redirect(`/users/${req.params.userId}`);
};

middleware.canModifyTechProduct = async (req, res, next) => {
  try {
    const techProduct = await TechProduct.findById(req.params.techProductId);
    if (!techProduct) {
      throw new Error();
    } else if (techProduct.author.id.equals(req.user._id) || req.user.isAdmin) {
      return next();
    }
    req.flash(
      "error",
      "Only the Tech Product creator has authorization to do that."
    );
    return res.redirect(`/techProducts/${req.params.techProductId}/reviews`);
  } catch (e) {
    req.flash("error", "Tech Product does not exist");
    return res.redirect("/techProducts");
  }
};

middleware.canModifyReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      throw new Error();
    } else if (review.author.id.equals(req.user._id) || req.user.isAdmin) {
      return next();
    }
    req.flash("error", "Only the review creator has authorization to do that.");
    return res.redirect("back");
  } catch (e) {
    req.flash("error", "Sorry, no review found.");
    return res.redirect("back");
  }
};

middleware.reviewStatus = async (userId, techProductId) =>
  await Review.findOne({ techProductId, "author.id": userId });

middleware.hasReviewed = async function (req, res, next) {
  const review = await middleware.reviewStatus(
    req.user._id,
    req.params.techProductId
  );
  if (!review) {
    return next();
  }
  req.flash(
    "error",
    "Seems you have already commented. You can only edit or delete your review."
  );
  return res.redirect(`/techProducts/${req.params.techProductId}/reviews`);
};

middleware.canModifyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      throw new Error();
    } else if (user._id.equals(req.user._id)) {
      return next();
    }
    req.flash(
      "error",
      "Only the account holder may make profile modifications."
    );
    return res.redirect(`/users/${req.params.userId}`);
  } catch (e) {
    req.flash("error", "User does not exist");
    return res.redirect("/techProducts");
  }
};

middleware.lowercaseEmail = (req, res, next) => {
  req.body.email = req.body.email.toLowerCase();
  next();
};

module.exports = middleware;
