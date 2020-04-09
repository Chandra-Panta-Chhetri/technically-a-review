const passport       = require('./passportLocalConfig'),
      GoogleStrategy = require('passport-google-oauth20'),
      User           = require('../../models/user'),
      cloudinary     = require('./cloudinaryConfig'),
      mongoose       = require('mongoose');

passport.use(new GoogleStrategy({
    clientID    : process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : "/auth/google/redirect"
}, async (accessToken, refreshToken, profile, done) => {
    var user = await User.findOne({googleId: profile.id});
    if(!user){
        const newUser = {
            _id: new mongoose.Types.ObjectId(),
            googleId : profile.id,
            email    : profile.emails[0].value,
            name     : profile.displayName
        }
        const result = await cloudinary.uploader.upload(profile.photos[0].value, {
            public_id: newUser._id,
            eager    : [ { width: 350, height: 250, crop: 'scale', quality: '100' } ]
        });
        newUser.avatarUrl = result.eager[0].secure_url;
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