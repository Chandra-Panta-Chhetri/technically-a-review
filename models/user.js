const mongoose = require("mongoose"),
  TechProduct = require("./techProduct"),
  Review = require("./review"),
  passportLocalMongoose = require("passport-local-mongoose"),
  userSchema = new mongoose.Schema(
    {
      googleId: { type: String, default: "-1" },
      email: { type: String, unique: true, required: true },
      password: String,
      name: { type: String, required: true },
      avatarUrl: {
        type: String,
        required: true,
        validate(value) {
          if (!value.toLowerCase().includes("cloudinary")) {
            throw new Error("Invalid avatar url");
          }
        }
      },
      resetPasswordToken: String,
      resetPasswordExpires: Date,
      isAdmin: { type: Boolean, default: false }
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
  for (let techProduct of techProducts) {
    await techProduct.remove();
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
