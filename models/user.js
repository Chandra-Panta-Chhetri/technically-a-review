const mongoose 			    = require("mongoose"),
	  Camp					= require("./camp"),
	  Comment				= require("./comment"),
	  passportLocalMongoose = require("passport-local-mongoose"),
	  userSchema 			= new mongoose.Schema({
		email: {type: String, unique: true, required: true},
		password: String,
		name: {type: String, required: true},
		avatar: {
			id: {type: String, required: true},
			url: {type: String, required: true}
		},
		resetPasswordToken: String,
		resetPasswordExpires: Date,
		isAdmin: {type: Boolean, default: false}
	  });

userSchema.plugin(passportLocalMongoose, {usernameField: 'email', usernameLowerCase: true});
userSchema.pre("remove", async function(next) {
	await Comment.deleteMany({"author.id": this._id});
	await Camp.deleteMany({"author.id": this._id});
	next();
});

module.exports = mongoose.model("User", userSchema);