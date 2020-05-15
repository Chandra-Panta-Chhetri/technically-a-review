const TechProduct = require("../models/techProduct");
const router = require("express").Router();
const middleware = require("../middleware");
const cloudinary = require("./configs/cloudinaryConfig");
const upload = require("./configs/multerConfig");
const mongoose = require("mongoose");
const helper = require("./helpers/helper");
const pusher = require("./configs/pusherConfig");

router.get("/", async (req, res) => {
  const perPage = 6;
  const filter = {};
  const categoryQuery = req.query.category || "";
  const searchQuery = req.query.search || "";
  var techProducts;
  var page = Number(req.query.page) || 1;
  var categoriesWithCount = [];
  var numTechProducts;
  try {
    if (searchQuery) {
      const nameRegex = new RegExp(helper.escapeRegex(req.query.search), "gi");
      filter.name = nameRegex;
      if (categoryQuery !== "") {
        filter.category = categoryQuery;
      }
      if (categoryQuery === "") {
        categoriesWithCount = await TechProduct.aggregate([
          { $match: { name: nameRegex } },
          {
            $group: {
              _id: { category: "$category" },
              categoryCount: { $sum: 1 }
            }
          }
        ]);
      }
    }
    numTechProducts = await TechProduct.find(filter).countDocuments();
    if (!(await helper.isValidPageNumber(page, numTechProducts, perPage))) {
      return res.redirect("/techProducts");
    }
    techProducts = await TechProduct.find(filter)
      .sort({ updatedAt: "desc" })
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();
    await helper.populateReviews(techProducts);
    for (let techProduct of techProducts) {
      techProduct.avgRating = helper.calculateAvgRating(techProduct.reviews);
      await techProduct.save();
    }
    return res.render("techProduct/index", {
      techProducts,
      pageName: "techProducts",
      currentPageNum: page,
      searchQuery,
      categoriesWithCount,
      categoryQuery
    });
  } catch (e) {
    res.redirect("/");
  }
});

router.get("/new", middleware.isLoggedIn, (req, res) =>
  res.render("techProduct/new")
);

router.post(
  "/",
  middleware.isLoggedIn,
  upload.single("image"),
  async (req, res) => {
    try {
      req.body.techProduct._id = new mongoose.Types.ObjectId();
      const result = await cloudinary.uploader.upload(req.file.path, {
        public_id: req.body.techProduct._id,
        eager: [{ width: 350, height: 250, crop: "scale", quality: "100" }]
      });
      req.body.techProduct.author = { id: req.user._id, name: req.user.name };
      req.body.techProduct.imageUrl = result.eager[0].secure_url;
      await TechProduct.create(req.body.techProduct);
      req.flash("success", "Tech product successfully created!");
      pusher.trigger("notifications", "changed_post_or_comment", {
        message: `${req.user.name} has just added a new tech product. Come check it out!`,
        url: `/techProducts/${req.body.techProduct._id}/reviews`
      });
    } catch (e) {
      req.flash(
        "error",
        "Tech product creation unsuccessful. Please try again later."
      );
    }
    return res.redirect("/techProducts");
  },
  (err, req, res, next) => {
    req.flash("error", err);
    res.redirect("/techProducts/new");
  }
);

router.get(
  "/:techProductId/edit",
  middleware.isLoggedIn,
  middleware.canModifyTechProduct,
  async (req, res) => {
    const techProduct = await TechProduct.findById(req.params.techProductId);
    return res.render("techProduct/edit", { techProduct });
  }
);

router.put(
  "/:techProductId",
  middleware.isLoggedIn,
  middleware.canModifyTechProduct,
  upload.single("image"),
  async (req, res) => {
    try {
      const techProduct = await TechProduct.findById(req.params.techProductId);
      if (req.file) {
        cloudinary.uploader.destroy(techProduct._id);
        const result = await cloudinary.uploader.upload(req.file.path, {
          public_id: techProduct._id,
          eager: [{ width: 350, height: 250, crop: "scale", quality: "100" }]
        });
        req.body.techProduct.imageUrl = result.eager[0].secure_url;
      }
      await techProduct.updateOne({ $set: req.body.techProduct });
      req.flash("success", "Tech product successfully updated!");
      pusher.trigger("notifications", "changed_post_or_comment", {
        message: `${req.body.techProduct.name} has just been updated. Come check it out!`,
        url: `/techProducts/${techProduct._id}/reviews`
      });
      return res.redirect(`/techProducts/${techProduct._id}/reviews`);
    } catch (e) {
      req.flash(
        "error",
        "Tech product update unsuccessful. Please try again later."
      );
      return res.redirect("/techProducts");
    }
  },
  (err, req, res, next) => {
    req.flash("error", err);
    res.redirect(`/techProducts/${req.params.techProductId}/edit`);
  }
);

router.delete(
  "/:techProductId",
  middleware.isLoggedIn,
  middleware.canModifyTechProduct,
  async (req, res) => {
    try {
      const techProduct = await TechProduct.findById(req.params.techProductId);
      const techProductName = techProduct.name;
      cloudinary.uploader.destroy(techProduct._id);
      await techProduct.remove();
      req.flash("success", "Tech product removed successfully!");
      pusher.trigger("notifications", "changed_post_or_comment", {
        message: `${techProductName} has been removed.`
      });
      return res.redirect("/techProducts");
    } catch (e) {
      req.flash(
        "error",
        "Tech product deletion unsuccessful. Please try again later."
      );
      res.redirect(`/techProducts/${req.params.techProductId}/reviews`);
    }
  }
);

module.exports = router;
