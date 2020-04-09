const User          = require('../../models/user');
const LocalStrategy = require('passport-local');
const passport      = require('passport');

passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()));

module.exports = passport;
