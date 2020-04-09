const middleware = {},
      Camp       = require('../models/camp'),
      Comment    = require('../models/comment'),
      User       = require('../models/user');

middleware.isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash('error', 'Please login before you continue.');
	res.redirect('/login');
};

middleware.hasLoggedIn = (req, res, next) => {
	if(!req.isAuthenticated()){
		return next();
	}
	req.flash("error", "Please logout before you do that.");
	res.redirect("/campgrounds");
}

middleware.hasCampAuth = async (req, res, next) => {
	try {
		const camp = await Camp.findById(req.params.campId);
		if (!camp) {
			throw new Error();
		} else if (camp.author.id.equals(req.user._id) || req.user.isAdmin) {
			return next();
		}
		req.flash('error', 'Only the camp creator has authorization to do that.');
		return res.redirect(`/campgrounds/${req.params.campId}`);
	} catch (e) {
		req.flash('error', 'Sorry, no campground found.');
		return res.redirect('/campgrounds');
	}
};

middleware.hasCommentAuth = async (req, res, next) => {
	try {
		const comment = await Comment.findById(req.params.commentId);
		if (!comment) {
			throw new Error();
		} else if (comment.author.id.equals(req.user._id) || req.user.isAdmin) {
			return next();
		}
		req.flash('error', 'Only the comment creator has authorization to do that.');
		return res.redirect('back');
	} catch (e) {
		req.flash('error', 'Sorry, no comment found.');
		return res.redirect('back');
	}
};

middleware.commentStatus = async (userId, campId) => await Comment.findOne({ campId, 'author.id': userId });

middleware.hasCommented = async function (req, res, next) {
	const comment = await middleware.commentStatus(req.user._id, req.params.campId);
	if (!comment) {
		return next();
	}
	req.flash('error', 'Seems you have already commented. You can only edit or delete your comment.');
	return res.redirect(`/campgrounds/${req.params.campId}`);
};

middleware.hasProfileAuth = async (req, res, next) => {
	try {
		const user = await User.findById(req.params.userId);
		if (!user) {
			throw new Error();
		} else if (user._id.equals(req.user._id)) {
			return next();
		}
		req.flash('error', 'Only the account holder may make profile modifications.');
		return res.redirect(`/users/${req.params.userId}`);
	} catch (e) {
		req.flash('error', 'Sorry, no user found.');
		return res.redirect('/campgrounds');
	}
};

middleware.lowercaseEmail = (req, res, next) => {
	req.body.email = req.body.email.toLowerCase();
	next();
};

module.exports = middleware;
