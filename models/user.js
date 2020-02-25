var mongoose 			  = require("mongoose"),
	passportLocalMongoose = require("passport-local-mongoose"),
	userSchema 			  = new mongoose.Schema({
								username: String,
								password: String,
								fullName: {type: String, required: true},
								email: {type: String, unique: true, required: true},
								avatar: {type: String, required: true},
								isAdmin: {type: Boolean, default: false}
							});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);