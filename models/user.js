const mongoose 			    = require("mongoose"),
	  passportLocalMongoose = require("passport-local-mongoose"),
	  userSchema 			= new mongoose.Schema({
		username: {type: String, unique: true, required: true},
		password: String,
		fullName: {type: String, required: true},
		email: {type: String, unique: true, required: true},
		avatar: {type: String, required: true},
		resetPasswordToken: String,
		resetPasswordExpires: Date,
		isAdmin: {type: Boolean, default: false}
	  });

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);