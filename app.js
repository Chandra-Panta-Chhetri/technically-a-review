require("dotenv").config();
const express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passportSetup = require("./routes/configs/passportGoogleConfig"),
  indexRoutes = require("./routes/index"),
  reviewRoutes = require("./routes/reviews"),
  techProductRoutes = require("./routes/techProducts"),
  userRoutes = require("./routes/users"),
  methodOverride = require("method-override"),
  flash = require("connect-flash"),
  cookieSession = require("cookie-session"),
  passport = require("passport");

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

app.listen(process.env.PORT, process.env.IP, () => {
  console.log("Server Online...");
});
