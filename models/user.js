const mongoose = require('mongoose');
const Camp = require('./camp');
const Comment = require('./comment');
const passportLocalMongoose = require('passport-local-mongoose');
const userSchema = new mongoose.Schema({
	email                : { type: String, unique: true, required: true },
	password             : String,
	name                 : { type: String, required: true },
	avatarUrl            : {
		type     : String,
		required : true,
		validate (value) {
			if (!value.toLowerCase().includes('cloudinary')) {
				throw new Error('Invalid avatar url');
			}
		}
	},
	resetPasswordToken   : String,
	resetPasswordExpires : Date,
	isAdmin              : { type: Boolean, default: false }
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email', usernameLowerCase: true });
userSchema.pre('remove', async function (next) {
	await Comment.deleteMany({ 'author.id': this._id });
	await Camp.deleteMany({ 'author.id': this._id });
	next();
});

module.exports = mongoose.model('User', userSchema);
