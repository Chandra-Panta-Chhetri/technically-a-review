var mongoose 			  = require("mongoose"),
	passportLocalMongoose = require("passport-local-mongoose"),
	userSchema 			  = new mongoose.Schema({
								username: String,
								password: String,
								fullName: String,
								email: {type: String, unique: true, required: true},
								avatar: String,
								isAdmin: {type: Boolean, default: false}
							});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);