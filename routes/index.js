var express 	= require("express"),
	router 		= express.Router(),
	Camp   		= require("../models/camp"),
	passport    = require("passport"),
	User		= require("../models/user"),
	asyncPack	= require("async"),
	nodemailer	= require("nodemailer"),
	crypto		= require("crypto");

router.get("/", function(req, res){
	res.render("home");
});

//AUTHENTICATION ROUTES
router.get("/login", function(req, res){
	res.render("user/login", {page: 'login'});	
});

router.post("/login", passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res){
	req.flash("success", "Welcome to Yelp Camp " + req.user.username);
	res.redirect("/campgrounds");
});

router.get("/signup", function(req, res){
	res.render("user/signup", {page: 'signup'});
});

router.post("/signup", function(req, res){
	var newUser = new User({
		username: req.body.username, 
		email: req.body.email,
		fullName: req.body.name,
		avatar: req.body.avatar
	});
	if(req.body.adminCode === process.env.ADMINCODE){
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			req.flash("error", err.message);
			res.redirect("/signup")
		}else{
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "Welcome to Yelp Camp " + user.username);
				res.redirect("/campgrounds");
			});
		}
	});
});

router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged you out")
	res.redirect("/campgrounds");
});

//USER ROUTES

router.get("/users/:id", function(req, res){
	User.findById(req.params.id, function(err, foundUser){
		if(err){
			req.flash("error", "User not found");
			res.redirect("back");
		}else{
			Camp.find({"author.id": foundUser._id}, function(err, camps){
				if(err){
					req.flash("error", "Cannot find camps associated with user");
					res.redirect("/campgrounds");
				}else{
					res.render("user/userInfo", {campCreator: foundUser, createdCamps: camps});
				}
			});
		}
	});
});

//PASSWORD RESET ROUTES
router.get("/forgot", function(req, res){
	res.render("user/forgot");
});

router.post("/forgot", function(req, res){
	asyncPack.waterfall([
		function(done){
			crypto.randomBytes(20, function(err, buf){
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done){
		 	User.findOne({username: req.body.username, email: req.body.email}, function(err, user){
				if(err || !user){
					req.flash("error", "User with provided username and email does not exist");
					return res.redirect("/forgot");
				}
				
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 900000; //15 mins
				user.save(function(err){
					done(err, token, user);
				});
			});
		},
		function(token, user, done){
			var smtpTransport = nodemailer.createTransport({
				service: 'Gmail',
				auth: {
					user: 'infonodeapp@gmail.com',
					pass: process.env.GMAILPW
				}
			});
			var mailContent = "You or someone requested a password change for the user with username: " + user.username + ".\nPlease click on the link below to reset your password:\n" + 'http://' + req.headers.host + '/reset/' + token
			var mailOptions = {
				to: user.email,
				from: 'infonodeapp@gmail.com',
				subject: 'Yelp Camp Password Reset',
				text: mailContent
			};
			smtpTransport.sendMail(mailOptions, function(err){
				req.flash("success", "To reset your password, please follow the instructions sent to " + 									req.body.email);
				done(err, 'done');
			});
		},
	], function(err){
		if(err){
			return next(err);
		}
		res.redirect("/forgot");
	});	
});

router.get("/reset/:token", function(req, res){
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
		 if(!user){
			 req.flash("error", "Password Reset Token has expired or is invalid");
			 return res.redirect("/forgot");
		 }
		res.render('user/reset', {token: req.params.token});
	});
});

router.post("/reset/:token", function(req, res){
	asyncPack.waterfall([
		function(done){
			User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
			 if(!user){
				 req.flash("error", "Password Reset Token has expired or is invalid");
				 return res.redirect("/forgot");
			 }
			 if(req.body.password === req.body.confirm){
				 user.setPassword(req.body.password, function(err){
					user.resetPasswordToken = undefined;
					user.resetPasswordExpires = undefined;
					user.save(function(err){
						req.logIn(user, function(err){
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
		function(user, done){
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
	], function(err){
		res.redirect("/campgrounds");
	});
});

module.exports = router;