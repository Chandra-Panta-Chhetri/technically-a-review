const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema(
  {
    author: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      name: { type: String, required: true }
    },
    comment: { type: String, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    techProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TechProduct",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
