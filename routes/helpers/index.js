const helper = {};
helper.calculateAvgRating = (comments) => {
	if(!comments.length){
		return 0;
	}
	var totalRating = 0;
	comments.forEach((comment) => {
		totalRating += comment.rating;
	});
	return Math.ceil(totalRating / comments.length);
}

module.exports = helper;