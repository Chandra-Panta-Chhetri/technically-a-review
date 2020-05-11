const TechProduct = require("../models/techProduct");
const router = require("express").Router();
const middleware = require("../middleware");
const cloudinary = require("./configs/cloudinaryConfig");
const upload = require("./configs/multerConfig");
const mongoose = require("mongoose");
const helper = require("./helpers/helper");
const pusher = require("./configs/pusherConfig");

router.get("/", async (req, res) => {
  var techProducts,
    page = req.query.page || 1,
    skipNum;
  const perPage = 6;
  try {
    if (req.query.search) {
      const regex = new RegExp(helper.escapeRegex(req.query.search), "gi");
      const numFilteredTechProducts = await TechProduct.find({
        $or: [{ name: regex }]
      }).countDocuments();
      if (
        numFilteredTechProducts &&
        (Number(page) <= 0 ||
          Number(page) > Math.ceil(numFilteredTechProducts / perPage))
      ) {
        return res.redirect("/techProducts");
      }
      skipNum = perPage * page - perPage;
      techProducts = await TechProduct.find({ $or: [{ name: regex }] })
        .sort({ updatedAt: "desc" })
        .skip(skipNum)
        .limit(perPage)
        .exec();
      await helper.populateReviews(techProducts);
      return res.render("techProduct/index", {
        techProducts,
        pageName: "techProducts",
        searched: true,
        currentPageNum: page,
        numTechProducts: numFilteredTechProducts,
        query: req.query.search
      });
    }
    const numTechProducts = await TechProduct.countDocuments();
    if (
      numTechProducts &&
      (Number(page) <= 0 || Number(page) > Math.ceil(numTechProducts / perPage))
    ) {
      return res.redirect("/techProducts");
    }
    skipNum = perPage * page - perPage;
    techProducts = await TechProduct.find({})
      .sort({ updatedAt: "desc" })
      .skip(skipNum)
      .limit(perPage)
      .exec();
    await helper.populateReviews(techProducts);
    return res.render("techProduct/index", {
      techProducts,
      pageName: "techProducts",
      searched: false,
      currentPageNum: page,
      numTechProducts
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
      const techProductId = new mongoose.Types.ObjectId();
      const result = await cloudinary.uploader.upload(req.file.path, {
        public_id: techProductId,
        eager: [{ width: 350, height: 250, crop: "scale", quality: "100" }]
      });
      req.body.techProduct.author = { id: req.user._id, name: req.user.name };
      req.body.techProduct.imageUrl = result.eager[0].secure_url;
      req.body.techProduct._id = techProductId;
      await TechProduct.create(req.body.techProduct);
      req.flash("success", "New tech product successfully created!");
      pusher.trigger("notifications", "changed_post_or_comment", {
        message: `${req.user.name} has just added a new tech Product. Come check it out!`,
        url: `/techProducts/${techProductId}/reviews`
      });
    } catch (e) {
      req.flash(
        "error",
        "Cannot create an techProduct at this time. Please try again later."
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
        url: `/techProducts/${req.params.techProductId}/reviews`
      });
      return res.redirect(`/techProducts/${req.params.techProductId}/reviews`);
    } catch (e) {
      req.flash("error", "Cannot update at this time. Please try again later.");
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
      techProduct.remove();
      req.flash("success", "Tech product removed successfully!");
      pusher.trigger("notifications", "changed_post_or_comment", {
        message: `${techProductName} has just been deleted.`
      });
      return res.redirect("/techProducts");
    } catch (e) {
      req.flash("error", "Cannot delete at this time. Please try again later.");
      res.redirect(`/techProducts/${req.params.techProductId}/reviews`);
    }
  }
);

module.exports = router;
