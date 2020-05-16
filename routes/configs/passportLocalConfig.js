const User = require("../../models/user");
const localStrategy = require("passport-local");
const passport = require("passport");

passport.use(
  new localStrategy({ usernameField: "email" }, User.authenticate())
);
