const helper = {};

helper.calculateAvgRating = (reviews) => {
  if (!reviews.length) {
    return 0;
  }
  var totalRating = 0;
  reviews.forEach((review) => {
    totalRating += review.rating;
  });
  return Math.ceil(totalRating / reviews.length);
};

helper.escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

helper.populateReviews = async (techProducts) => {
  for (let techProduct of techProducts) {
    await techProduct.populate("reviews").execPopulate();
  }
};

module.exports = helper;
