const mongoose 			    = require("mongoose"),
	  Camp					= require("./camp"),
	  Comment				= require("./comment"),
	  passportLocalMongoose = require("passport-local-mongoose"),
	  userSchema 			= new mongoose.Schema({
		username: {type: String, unique: true, required: true},
		password: String,
		fullName: {type: String, required: true},
		email: {type: String, unique: true, required: true},
		avatar: {
			id: {type: String, required: true},
			url: {type: String, required: true}
		},
		resetPasswordToken: String,
		resetPasswordExpires: Date,
		isAdmin: {type: Boolean, default: false}
	  });

userSchema.plugin(passportLocalMongoose);

userSchema.pre("remove", async function(next) {
	await Comment.deleteMany({"author.id": this._id});
	await Camp.deleteMany({"author.id": this._id});
	next();
});

module.exports = mongoose.model("User", userSchema);