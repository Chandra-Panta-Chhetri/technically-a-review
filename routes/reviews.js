const TechProduct = require("../models/techProduct");
const Review = require("../models/review");
const router = require("express").Router({ mergeParams: true });
const middleware = require("../middleware");
const helper = require("./helpers/helper");
const pusher = require("./configs/pusherConfig");

router.get("/", async (req, res) => {
  try {
    var page = Number(req.query.page) || 1;
    const perPage = 4,
      techProduct = await TechProduct.findById(req.params.techProductId),
      numOfReviews = await Review.find({
        techProductId: techProduct._id
      }).countDocuments();
    if (!techProduct) {
      throw new Error();
    }
    if (
      numOfReviews &&
      (page <= 0 || page > Math.ceil(numOfReviews / perPage))
    ) {
      return res.redirect(`/techProducts/${req.params.techProductId}/reviews`);
    }
    await techProduct
      .populate({
        path: "reviews",
        options: {
          skip: perPage * page - perPage,
          limit: perPage,
          sort: { updatedAt: "desc" }
        }
      })
      .execPopulate();
    if (req.user) {
      const review = await middleware.reviewStatus(
        req.user._id,
        req.params.techProductId
      );
      return res.render("techProduct/show", {
        techProduct,
        numOfReviews,
        reviewId: review === null ? -1 : review._id,
        currentPageNum: page
      });
    }
    return res.render("techProduct/show", {
      techProduct,
      numOfReviews,
      reviewId: -1,
      currentPageNum: page
    });
  } catch (e) {
    req.flash("error", "Sorry, no techProduct found.");
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
      req.flash("error", "Tech product not found");
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
      const techProductReviews = await Review.find({
        techProductId: techProduct._id
      });
      techProduct.avgRating = helper.calculateAvgRating(techProductReviews);
      await techProduct.save();
      req.flash("success", "Review successfully created!");
      pusher.trigger("notifications", "changed_post_or_comment", {
        message: `${req.user.name} has just left a new review in ${techProduct.name}. Come check it out!`,
        url: `/techProducts/${techProduct._id}/reviews`
      });
      return res.redirect(`/techProducts/${req.params.techProductId}/reviews`);
    } catch (e) {
      req.flash("error", "Tech product not found");
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
      const techProduct = await TechProduct.findById(req.params.techProductId),
        techProductReviews = await Review.find({
          techProductId: techProduct._id
        });
      if (!techProductReviews.length || !techProduct) {
        throw new Error();
      }
      techProduct.avgRating = helper.calculateAvgRating(techProductReviews);
      await techProduct.save();
      req.flash("success", "Review successfully updated!");
      return res.redirect(`/techProducts/${req.params.techProductId}/reviews`);
    } catch (e) {
      req.flash(
        "error",
        "Cannot update review at this time. Please try again later."
      );
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
      const techProduct = await TechProduct.findById(req.params.techProductId),
        techProductReviews = await Review.find({
          techProductId: techProduct._id
        });
      if (!techProduct) {
        throw new Error();
      }
      techProduct.avgRating = helper.calculateAvgRating(techProductReviews);
      await techProduct.save();
      req.flash("success", "Review was successfully deleted!");
      pusher.trigger("notifications", "changed_post_or_comment", {
        message: `${req.user.name} has removed their review for ${techProduct.name}.`
      });
    } catch (e) {
      req.flash("error", "Cannot delete review. Please try again later.");
    }
    return res.redirect(`/techProducts/${req.params.techProductId}/reviews`);
  }
);

module.exports = router;
