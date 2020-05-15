require("dotenv").config();
const mongoose = require("mongoose");
const TechProduct = require("../models/techProduct");
const Review = require("../models/review");
const User = require("../models/user");
const techProductsSeed = [
  {
    name: "One Plus 7 Pro",
    imageUrl:
      "https://res.cloudinary.com/nodeproject/image/upload/v1589223072/devices_gzl14y.jpg",
    description: "Description goes here",
    category: "phones",
    price: "750.54",
    avgRating: 3
  },
  {
    name: "Surface Pro",
    imageUrl:
      "https://res.cloudinary.com/nodeproject/image/upload/v1589223069/surface_pro_k5h40e.jpg",
    description: "Description goes here",
    category: "laptops",
    price: "1459.65",
    avgRating: 4
  }
];

const usersSeed = [
  {
    _id: new mongoose.Types.ObjectId(),
    email: "john@doe.com",
    name: "John Doe",
    avatarUrl:
      "https://res.cloudinary.com/nodeproject/image/upload/v1589223074/watch_uebhcv.jpg"
  },
  {
    _id: new mongoose.Types.ObjectId(),
    email: "jimmy@chan.com",
    name: "Jimmy Denver",
    avatarUrl:
      "https://res.cloudinary.com/nodeproject/image/upload/v1589223067/headphones_tlmuot.jpg"
  }
];

const reviewsSeed = [
  { comment: "Test Comment From John", rating: 3 },
  { comment: "Test Comment From Jimmy", rating: 4 }
];

mongoose.connect(process.env.DBURL, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true
});

async function seedDB() {
  const techProducts = await TechProduct.find({});
  //using loop only because techProduct middleware removes picture saved on cloudinary when using remove() on model instance
  for (let techProduct of techProducts) {
    await techProduct.remove({});
  }
  await User.deleteMany({});
  for (let i = 0; i < techProductsSeed.length; i++) {
    await User.register(usersSeed[i], "password");
    techProductsSeed[i]._id = new mongoose.Types.ObjectId();
    techProductsSeed[i].author = {
      id: usersSeed[i]._id,
      name: usersSeed[i].name
    };
    await TechProduct.create(techProductsSeed[i]);
    reviewsSeed[i].techProductId = techProductsSeed[i]._id;
    reviewsSeed[i].author = { id: usersSeed[i]._id, name: usersSeed[i].name };
    await Review.create(reviewsSeed[i]);
  }
}
seedDB();
console.log("Done Seeding DB");
