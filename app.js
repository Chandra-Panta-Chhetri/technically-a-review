require("dotenv").config();
require("./routes/configs/passportGoogleConfig");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const indexRoutes = require("./routes/index");
const reviewRoutes = require("./routes/reviews");
const techProductRoutes = require("./routes/techProducts");
const userRoutes = require("./routes/users");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const cookieSession = require("cookie-session");
const passport = require("passport");

mongoose.connect(process.env.DBURL, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useUnifiedTopology: true
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/public`));
app.use(flash());
app.set("view engine", "ejs");

app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [process.env.SESSION_SECRET]
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.moment = require("moment");
  next();
});

app.use("/", indexRoutes);
app.use("/users", userRoutes);
app.use("/techProducts", techProductRoutes);
app.use("/techProducts/:techProductId/reviews", reviewRoutes);
app.get("*", function (req, res) {
  res.render("error404");
});

app.listen(process.env.PORT, process.env.IP, () => {
  console.log("Server Online...");
});
