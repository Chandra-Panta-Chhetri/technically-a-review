const passport       = require('./passportLocalConfig'),
      GoogleStrategy = require('passport-google-oauth20'),
      User           = require('../../models/user');

passport.use(new GoogleStrategy({
    clientID    : process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : "/auth/google/redirect"
}, async (accessToken, refreshToken, profile, done) => {
    var user = await User.findOne({googleId: profile.id});
    if(!user){
        const newUser = {
            googleId : profile.id,
            email    : profile.emails[0].value,
            name     : profile.displayName,
            avatarUrl: profile.photos[0].value
        }
        user = await User.create(newUser);
    }
    done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

module.exports = passport;