const User          = require('../../models/user');
const LocalStrategy = require('passport-local');
const passport      = require('passport');

passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

module.exports = passport;
