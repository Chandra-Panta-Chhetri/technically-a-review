const express = require('express'),
	router = express.Router(),
	Camp = require('../models/camp'),
	Comment = require('../models/comment'),
	middleware = require('../middleware/index'),
	cloudinary = require('./utils/cloudinaryConfig'),
	upload = require('./utils/multerConfig'),
	mongoose = require('mongoose'),
	helper = require('./helpers/index');

router.get('/', (req, res) => res.redirect('/campgrounds/page/1'));

router.get('/page/:currentPageNum', async (req, res) => {
	var camps,
		page = req.params.currentPageNum || 1,
		skipNum;
	const perPage = 1;
	try {
		if (req.query.search) {
			const regex = new RegExp(helper.escapeRegex(req.query.search), 'gi');
			const numCampsFiltered = await Camp.find({
				$or: [ { name: regex } ]
			}).countDocuments();
			if (Number(page) <= 0 || Number(page) > numCampsFiltered) {
				return res.redirect('/campgrounds/page/1');
			}
			skipNum = perPage * page - perPage;
			camps = await Camp.find({ $or: [ { name: regex }, { 'author.name': regex } ] })
				.sort({ updatedAt: 'desc' })
				.skip(skipNum)
				.limit(perPage)
				.exec();
			await helper.populateComments(camps);
			return res.render('campground/index', {
				camps,
				pageName: 'campgrounds',
				searched: true,
				currentPageNum: page,
				numCamps: numCampsFiltered,
				query: req.query.search
			});
		}
		const numCamps = await Camp.countDocuments();
		if (Number(page) <= 0 || Number(page) > numCamps) {
			return res.redirect('/campgrounds/page/1');
		}
		skipNum = perPage * page - perPage;
		camps = await Camp.find({}).sort({ updatedAt: 'desc' }).skip(skipNum).limit(perPage).exec();
		await helper.populateComments(camps);
		return res.render('campground/index', {
			camps,
			pageName: 'campgrounds',
			searched: false,
			currentPageNum: page,
			numCamps
		});
	} catch (e) {
		res.redirect('/');
	}
});

router.get('/new', middleware.isLoggedIn, (req, res) => res.render('campground/new'));

router.post(
	'/',
	middleware.isLoggedIn,
	upload.single('image'),
	async (req, res) => {
		try {
			const campId = new mongoose.Types.ObjectId();
			const result = await cloudinary.uploader.upload(req.file.path, {
				public_id: campId,
				eager: [ { width: 350, height: 250, crop: 'scale', quality: '100' } ]
			});
			req.body.camp.author = { id: req.user._id, name: req.user.name };
			req.body.camp.imageUrl = result.eager[0].secure_url;
			req.body.camp._id = campId;
			await Camp.create(req.body.camp);
			req.flash('success', 'Campground successfully created!');
		} catch (e) {
			req.flash('error', 'Cannot create a camp at this time. Please try again later.');
		}
		return res.redirect('/campgrounds');
	},
	(err, req, res, next) => {
		req.flash('error', err);
		res.redirect('/campgrounds/new');
	}
);

router.get('/:campId', async (req, res) => {
	try {
		const comments = await Comment.find({ campId: req.params.campId });
		const camp = await Camp.findById(req.params.campId);
		if (!camp) {
			throw new Error();
		}
		if (req.user) {
			const comment = await middleware.commentStatus(req.user._id, req.params.campId);
			return res.render('campground/show', { camp, comments, commentId: comment === null ? -1 : comment._id });
		}
		return res.render('campground/show', { camp, comments, commentId: -1 });
	} catch (e) {
		req.flash('error', 'Sorry, no campground found.');
		return res.redirect('/campgrounds/page/1');
	}
});

router.get('/:campId/edit', middleware.isLoggedIn, middleware.hasCampAuth, async (req, res) => {
	const camp = await Camp.findById(req.params.campId);
	return res.render('campground/edit', { camp });
});

router.put(
	'/:campId',
	middleware.isLoggedIn,
	middleware.hasCampAuth,
	upload.single('image'),
	async (req, res) => {
		try {
			const camp = await Camp.findById(req.params.campId);
			if (req.file) {
				cloudinary.uploader.destroy(camp._id);
				const result = await cloudinary.uploader.upload(req.file.path, {
					public_id: camp._id,
					eager: [ { width: 350, height: 250, crop: 'scale', quality: '100' } ]
				});
				req.body.camp.imageUrl = result.eager[0].secure_url;
			}
			await camp.updateOne({ $set: req.body.camp });
			req.flash('success', 'Camp Successfully Updated!');
			return res.redirect(`/campgrounds/${req.params.campId}`);
		} catch (e) {
			req.flash('error', 'Cannot update at this time. Please try again later.');
			return res.redirect('/campgrounds');
		}
	},
	(err, req, res, next) => {
		req.flash('error', err);
		res.redirect(`/campgrounds/${req.params.campId}/edit`);
	}
);

router.delete('/:campId', middleware.isLoggedIn, middleware.hasCampAuth, async (req, res) => {
	try {
		const camp = await Camp.findById(req.params.campId);
		cloudinary.uploader.destroy(camp._id);
		camp.remove();
		req.flash('success', 'Campground deleted successfully!');
		return res.redirect('/campgrounds');
	} catch (e) {
		req.flash('error', 'Cannot delete at this time. Please try again later.');
		res.redirect(`/campgrounds/${req.params.campId}`);
	}
});

module.exports = router;
