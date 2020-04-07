require('dotenv').config();
const express          = require('express'),
      app              = express(),
      bodyParser       = require('body-parser'),
      mongoose         = require('mongoose'),
      indexRoutes      = require('./routes/index'),
      commentRoutes    = require('./routes/comments'),
      campgroundRoutes = require('./routes/campgrounds'),
      userRoutes       = require('./routes/users'),
      methodOverride   = require('method-override'),
      flash            = require('connect-flash'),
      passport         = require('./routes/utils/passportLocalConfig');

mongoose.connect(process.env.DBURL, {
	useNewUrlParser   : true,
	useFindAndModify  : false,
	useCreateIndex    : true,
	useUnifiedTopology: true
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/public`));
app.use(flash());
app.set('view engine', 'ejs');

app.use(require('express-session')({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.error       = req.flash('error');
	res.locals.success     = req.flash('success');
	res.locals.moment      = require('moment');
	next();
});

app.use('/', indexRoutes);
app.use('/users', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:campId/comments', commentRoutes);

app.listen(process.env.PORT, process.env.IP, () => {
	console.log('Server Online...');
});
