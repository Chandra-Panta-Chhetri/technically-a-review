const express 	 = require("express"),
	  router     = express.Router(),
	  passport   = require("passport"),
	  User		 = require("../models/user"),
	  asyncPack	 = require("async"),
	  nodemailer = require("nodemailer"),
	  crypto	 = require("crypto");

router.get("/", (req, res) => res.render("home"));

router.get("/login", (req, res) => res.render("user/login", {page: 'login'}));

router.post("/login", passport.authenticate('local', { failureRedirect: '/login', failureFlash: "Incorrect username or password."}),
  (req, res) => {
	req.flash("success", "Welcome to Yelp Camp, " + req.user.username + "!");
	return res.redirect("/campgrounds");
});

router.get("/signup", (req, res) => res.render("user/signup", {page: 'signup'}));

router.post("/signup", async (req, res) => {
	try {
		const userPassword = req.body.newUser.password;
		req.body.newUser.isAdmin = req.body.newUser.code === process.env.ADMINCODE;
		delete req.body.newUser.code;
		delete req.body.newUser.password;
		const user = await User.register(req.body.newUser, userPassword);
		req.logIn(user, (err) => {
			req.flash("success", "Welcome to Yelp Camp " + user.username);
			return res.redirect("/campgrounds");
		});
	} catch (e) {
		req.flash("error", e.message);
		return res.redirect("/signup");
	}
});

router.get("/logout", (req, res) => {
	req.logout();
	req.flash("success", "Successfully logged out!");
	return res.redirect("/campgrounds");
});

router.get("/forgot", (req, res) => res.render("user/forgot"));

router.post("/forgot", (req, res) => {
	asyncPack.waterfall([
		(done) => {
			crypto.randomBytes(20, (err, buf) => {
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		(token, done) => {
		 	User.findOne({username: req.body.username, email: req.body.email}, (err, user) => {
				if(err || !user){
					req.flash("error", "User with provided username or email does not exist.");
					return res.redirect("/forgot");
				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 900000; //15 mins
				user.save((err) => {
					done(err, token, user);
				});
			});
		},
		(token, user, done) => {
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
					user: 'infonodeapp@gmail.com',
					pass: process.env.GMAILPW
				}
			});
			var mailContent = "You or someone requested a password change for the user with username: " + user.username + ".\nPlease click on the link below to reset your password:\n" + 'http://' + req.headers.host + '/reset/' + token + "\nNote: This link will expire in 15 mins.";
			var mailOptions = {
				to: user.email,
				from: 'infonodeapp@gmail.com',
				subject: 'Yelp Camp Password Reset',
				text: mailContent
			};
			smtpTransport.sendMail(mailOptions, (err) => {
				req.flash("success", "To reset your password, please follow the instructions sent to " + req.body.email);
				done(err, 'done');
			});
		},
	], (err) => res.redirect("/forgot"));	
});

router.get("/reset/:token", async (req, res) => {
	try {
		await User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}});
		return res.render('user/reset', {token: req.params.token});
	} catch (e) {
		req.flash("error", "Password reset token has expired or is invalid.");
		return res.redirect("/forgot");
	}
});

router.post("/reset/:token", (req, res) => {
	asyncPack.waterfall([
		(done) => {
			User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user) => {
			 if(!user || err){
				 req.flash("error", "Password Reset Token has expired or is invalid.");
				 return res.redirect("/forgot");
			 }
			 if(req.body.password === req.body.confirm){
				 user.setPassword(req.body.password, (err) => {
					user.resetPasswordToken = undefined;
					user.resetPasswordExpires = undefined;
					user.save((err) => {
						req.logIn(user, (err) =>{
							done(err, user);
						});
					});
				 });
			 }else{
				 req.flash("error", "Passwords did not match");
				 res.redirect("back");
			 }
			});
		}, 
		(user, done) => {
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
					user: 'infonodeapp@gmail.com',
					pass: process.env.GMAILPW
				}
			});
			var mailOptions = {
				to: user.email,
				from: 'infonodeapp@gmail.com',
				subject: 'Yelp Camp Password Reset',
				text: 'This is a confirmation email to inform you that your password has been successfully changed!'
			};
			smtpTransport.sendMail(mailOptions, function(err){
				req.flash("success", "Your Password has been changed successfully");
				done(err);
			});
		}
	], (err) => res.redirect("/campgrounds"));
});

module.exports = router;