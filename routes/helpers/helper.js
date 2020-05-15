const helper = {};

helper.calculateAvgRating = (reviews) => {
  if (!reviews.length) {
    return 0;
  }
  var totalRating = 0;
  for (let review of reviews) {
    totalRating += review.rating;
  }
  return Math.ceil(totalRating / reviews.length);
};

helper.escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

helper.populateReviews = async (techProducts) => {
  for (let techProduct of techProducts) {
    await techProduct.populate("reviews").execPopulate();
  }
};

helper.isValidPageNumber = async (pageNum, numOfItems, itemsPerPage) => {
  if (
    numOfItems &&
    (pageNum <= 0 || pageNum > Math.ceil(numOfItems / itemsPerPage))
  ) {
    return false;
  }
  return true;
};

module.exports = helper;
