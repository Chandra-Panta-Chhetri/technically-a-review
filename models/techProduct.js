const mongoose = require("mongoose");
const Review = require("./review");
const cloudinary = require("../routes/configs/cloudinaryConfig");
const techProductSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true },
    imageUrl: {
      type: String,
      required: true,
      validate(value) {
        if (!value.toLowerCase().includes("cloudinary")) {
          throw new Error("Invalid image url.");
        }
      }
    },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: String, required: true },
    author: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      name: { type: String, required: true }
    },
    avgRating: { type: Number, default: 0, min: 0, max: 5 }
  },
  { timestamps: true }
);

techProductSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "techProductId"
});

techProductSchema.pre("remove", async function (next) {
  await Review.deleteMany({ techProductId: this._id });
  cloudinary.uploader.destroy(this._id);
  next();
});

module.exports = mongoose.model("TechProduct", techProductSchema);
