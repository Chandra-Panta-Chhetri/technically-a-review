const helper = {};

helper.calculateAvgRating = (comments) => {
	if (!comments.length) {
		return 0;
	}
	var totalRating = 0;
	comments.forEach((comment) => {
		totalRating += comment.rating;
	});
	return Math.ceil(totalRating / comments.length);
};

helper.escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

module.exports = helper;
