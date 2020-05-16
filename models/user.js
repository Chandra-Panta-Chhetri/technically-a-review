const mongoose = require("mongoose");
const TechProduct = require("./techProduct");
const Review = require("./review");
const passportLocalMongoose = require("passport-local-mongoose");
const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, default: "-1" },
    email: { type: String, unique: true, required: true },
    password: String,
    name: { type: String, required: true },
    avatarUrl: {
      type: String,
      validate(value) {
        //ensures all pictures were uploaded to cloudinary
        if (!value.toLowerCase().includes("cloudinary")) {
          throw new Error("Invalid avatar url.");
        }
      }
    },
    isAdmin: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  { timestamps: true }
);

userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  usernameLowerCase: true
});

userSchema.pre("remove", async function (next) {
  await Review.deleteMany({ "author.id": this._id });
  const techProducts = await TechProduct.find({ "author.id": this._id });
  //using loop triggers techProduct middleware that ensures picture stored in cloudinary is
  //removed before techProduct removed
  for (let techProduct of techProducts) {
    await techProduct.remove();
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
