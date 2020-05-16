const TechProduct = require("../models/techProduct");
const Review = require("../models/review");
const router = require("express").Router({ mergeParams: true });
const middleware = require("../middleware");
const helper = require("./helpers/helper");
const pusher = require("./configs/pusherConfig");

router.get("/", async (req, res) => {
  try {
    var page = Number(req.query.page) || 1;
    var reviewId = -1;
    const perPage = 4;
    const techProduct = await TechProduct.findById(req.params.techProductId);
    if (!techProduct) {
      throw new Error();
    }
    const allReviews = await Review.find({
      techProductId: techProduct._id
    });
    if (!(await helper.isValidPageNumber(page, allReviews.length, perPage))) {
      return res.redirect(`/techProducts/${techProduct._id}/reviews`);
    }
    techProduct.avgRating = helper.calculateAvgRating(allReviews);
    await techProduct.save();
    const paginatedReviews = await Review.find({
      techProductId: techProduct._id
    })
      .sort({ updatedAt: "desc" })
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();
    if (req.user) {
      const loggedInUsersReview = await middleware.getReviewByUserIdAndTechId(
        req.user._id,
        req.params.techProductId
      );
      reviewId = loggedInUsersReview === null ? -1 : loggedInUsersReview._id;
    }
    return res.render("techProduct/show", {
      techProduct,
      reviews: paginatedReviews,
      totalReviews: allReviews.length,
      reviewId,
      currentPageNum: page
    });
  } catch (e) {
    req.flash("error", "Tech product does not exist.");
    return res.redirect("/techProducts");
  }
});

router.get(
  "/new",
  middleware.isLoggedIn,
  middleware.hasReviewed,
  async (req, res) => {
    try {
      const techProduct = await TechProduct.findById(req.params.techProductId);
      if (!techProduct) {
        throw new Error();
      }
      return res.render("review/new", { techProduct });
    } catch (e) {
      req.flash("error", "Tech product does not exist.");
      return res.redirect("/techProducts");
    }
  }
);

router.post(
  "/",
  middleware.isLoggedIn,
  middleware.hasReviewed,
  async (req, res) => {
    try {
      const techProduct = await TechProduct.findById(req.params.techProductId);
      if (!techProduct) {
        throw new Error();
      }
      req.body.review.techProductId = techProduct._id;
      req.body.review.author = { id: req.user._id, name: req.user.name };
      await Review.create(req.body.review);
      req.flash("success", "Review successfully created!");
      pusher.trigger("notifications", "changed_post_or_comment", {
        message: `${req.user.name} has just posted a new review in ${techProduct.name}. Come check it out!`,
        url: `/techProducts/${techProduct._id}/reviews`
      });
      return res.redirect(`/techProducts/${techProduct._id}/reviews`);
    } catch (e) {
      req.flash("error", "Tech product does not exist.");
      return res.redirect("/techProducts");
    }
  }
);

router.get(
  "/:reviewId/edit",
  middleware.isLoggedIn,
  middleware.canModifyReview,
  async (req, res) => {
    const review = await Review.findById(req.params.reviewId);
    return res.render("review/edit", {
      techProductId: req.params.techProductId,
      review
    });
  }
);

router.put(
  "/:reviewId",
  middleware.isLoggedIn,
  middleware.canModifyReview,
  async (req, res) => {
    try {
      await Review.findByIdAndUpdate(req.params.reviewId, req.body.review);
      const techProduct = await TechProduct.findById(req.params.techProductId);
      if (!techProduct) {
        throw new Error();
      }
      req.flash("success", "Review successfully updated!");
      pusher.trigger("notifications", "changed_post_or_comment", {
        message: `${req.user.name} has updated their review for ${techProduct.name}. Come check it out!`,
        url: `/techProducts/${techProduct._id}/reviews`
      });
      return res.redirect(`/techProducts/${techProduct._id}/reviews`);
    } catch (e) {
      req.flash("error", "Review update unsuccessful. Please try again later.");
      return res.redirect("/techProducts");
    }
  }
);

router.delete(
  "/:reviewId",
  middleware.isLoggedIn,
  middleware.canModifyReview,
  async (req, res) => {
    try {
      await Review.findByIdAndRemove(req.params.reviewId);
      const techProduct = await TechProduct.findById(req.params.techProductId);
      if (!techProduct) {
        throw new Error();
      }
      req.flash("success", "Review successfully deleted!");
      pusher.trigger("notifications", "changed_post_or_comment", {
        message: `${req.user.name} has removed their review for ${techProduct.name}.`
      });
    } catch (e) {
      req.flash(
        "error",
        "Review deletion unsuccessful. Please try again later."
      );
    }
    return res.redirect(`/techProducts/${req.params.techProductId}/reviews`);
  }
);

module.exports = router;
