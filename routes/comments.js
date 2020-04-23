const express = require('express'),
	router = express.Router({ mergeParams: true }),
	Camp = require('../models/camp'),
	Comment = require('../models/comment'),
	middleware = require('../middleware/index'),
	helper = require('./helpers/index');

router.get('/', (req, res) => res.redirect(`/campgrounds/${req.params.campId}/comments/page/1`));
router.get('/page/:currentPageNum', async (req, res) => {
	try {
		var page = req.params.currentPageNum || 1;
		const perPage = 4,
			camp = await Camp.findById(req.params.campId),
			numOfComments = await Comment.find({ campId: camp._id }).countDocuments();
		if (!camp) {
			throw new Error();
		}
		if (Number(page) <= 0 || Number(page) > Math.ceil(numOfComments / perPage)) {
			return res.redirect(`/campgrounds/${req.params.campId}/comments/page/1`);
		}
		await camp
			.populate({
				path: 'comments',
				options: {
					skip: perPage * page - perPage,
					limit: perPage,
					sort: { updatedAt: 'desc' }
				}
			})
			.execPopulate();
		if (req.user) {
			const comment = await middleware.commentStatus(req.user._id, req.params.campId);
			return res.render('campground/show', {
				camp,
				numOfComments,
				commentId: comment === null ? -1 : comment._id,
				currentPageNum: page
			});
		}
		return res.render('campground/show', {
			camp,
			numOfComments,
			commentId: -1,
			currentPageNum: page
		});
	} catch (e) {
		req.flash('error', 'Sorry, no campground found.');
		return res.redirect('/campgrounds/page/1');
	}
});

router.get('/new', middleware.isLoggedIn, middleware.hasCommented, async (req, res) => {
	try {
		const camp = await Camp.findById(req.params.campId);
		if (!camp) {
			throw new Error();
		}
		return res.render('comment/new', { camp });
	} catch (e) {
		req.flash('error', 'Campground not found');
		return res.redirect('/campgrounds/page/1');
	}
});

router.post('/', middleware.isLoggedIn, middleware.hasCommented, async (req, res) => {
	try {
		const camp = await Camp.findById(req.params.campId);
		if (!camp) {
			throw new Error();
		}
		req.body.comment.campId = camp._id;
		req.body.comment.author = { id: req.user._id, name: req.user.name };
		await Comment.create(req.body.comment);
		const campComments = await Comment.find({ campId: camp._id });
		camp.avgRating = helper.calculateAvgRating(campComments);
		await camp.save();
		req.flash('success', 'Comment successfully added.');
		return res.redirect(`/campgrounds/${req.params.campId}/comments/page/1`);
	} catch (e) {
		req.flash('error', 'No campground found.');
		return res.redirect('/campgrounds/page/1');
	}
});

router.get('/:commentId/edit', middleware.isLoggedIn, middleware.hasCommentAuth, async (req, res) => {
	const comment = await Comment.findById(req.params.commentId);
	return res.render('comment/edit', { campId: req.params.campId, comment });
});

router.put('/:commentId', middleware.isLoggedIn, middleware.hasCommentAuth, async (req, res) => {
	try {
		await Comment.findByIdAndUpdate(req.params.commentId, req.body.comment);
		const camp = await Camp.findById(req.params.campId),
			campComments = await Comment.find({ campId: camp._id });
		if (!campComments.length || !camp) {
			throw new Error();
		}
		camp.avgRating = helper.calculateAvgRating(campComments);
		await camp.save();
		req.flash('success', 'Comment successfully updated!');
		return res.redirect(`/campgrounds/${req.params.campId}/comments/page/1`);
	} catch (e) {
		req.flash('error', 'Cannot update comment at this time. Please try again later.');
		return res.redirect('/campgrounds/page/1');
	}
});

router.delete('/:commentId', middleware.isLoggedIn, middleware.hasCommentAuth, async (req, res) => {
	try {
		await Comment.findByIdAndRemove(req.params.commentId);
		const camp = await Camp.findById(req.params.campId),
			campComments = await Comment.find({ campId: camp._id });
		if (!camp) {
			throw new Error();
		}
		camp.avgRating = helper.calculateAvgRating(campComments);
		await camp.save();
		req.flash('success', 'Comment was successfully deleted!');
	} catch (e) {
		req.flash('error', 'Cannot delete comment. Please try again later.');
	}
	return res.redirect(`/campgrounds/${req.params.campId}/comments/page/1`);
});

module.exports = router;
