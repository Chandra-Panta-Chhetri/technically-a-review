const express = require("express"),
  router = express.Router(),
  passport = require("passport"),
  User = require("../models/user"),
  Async = require("async"),
  nodemailer = require("nodemailer"),
  middleware = require("../middleware/index"),
  crypto = require("crypto");

router.get("/login", middleware.hasLoggedIn, (req, res) =>
  res.render("user/login", { pageName: "login" })
);

router.post(
  "/login",
  middleware.hasLoggedIn,
  middleware.lowercaseEmail,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "Incorrect email or password."
  }),
  (req, res) => {
    req.flash("success", `Welcome back ${req.user.name}!`);
    return res.redirect("/campgrounds");
  }
);

router.get("/signup", middleware.hasLoggedIn, (req, res) =>
  res.render("user/signup", { pageName: "signup" })
);

router.get("/logout", middleware.isLoggedIn, (req, res) => {
  req.logout();
  req.flash("success", "Successfully logged out!");
  res.redirect("/campgrounds");
});

router.get("/forgot", (req, res) => res.render("user/forgot"));

router.post("/forgot", (req, res) => {
  Async.waterfall(
    [
      (done) => {
        crypto.randomBytes(20, (err, buf) => {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      (token, done) => {
        User.findOne({ email: req.body.email.toLowerCase() }, (err, user) => {
          if (err || !user || user.googleId !== "-1") {
            req.flash(
              "success",
              `To reset your password, please follow the instructions sent to ${req.body.email.toLowerCase()}`
            );
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
          service: "Gmail",
          auth: {
            user: "infonodeapp@gmail.com",
            pass: process.env.GMAILPW
          }
        });
        var mailContent = `You or someone requested a password change for the user with username: ${user.email}.\nPlease click on the link below to reset your password:\nhttp://${req.headers.host}/reset/${token}\nNote: This link will expire in 15 mins.`;
        var mailOptions = {
          to: user.email,
          from: "infonodeapp@gmail.com",
          subject: "Yelp Camp Password Reset",
          text: mailContent
        };
        smtpTransport.sendMail(mailOptions, (err) => {
          req.flash(
            "success",
            `To reset your password, please follow the instructions sent to ${req.body.email}`
          );
          done(err, "done");
        });
      }
    ],
    (err) => res.redirect("/forgot")
  );
});

router.get("/reset/:token", async (req, res) => {
  try {
    await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    return res.render("user/reset", { token: req.params.token });
  } catch (e) {
    req.flash("error", "Password reset token has expired or is invalid.");
    return res.redirect("/forgot");
  }
});

router.post("/reset/:token", (req, res) => {
  Async.waterfall(
    [
      (done) => {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
          },
          (err, user) => {
            if (!user || err) {
              req.flash(
                "error",
                "Password reset token has expired or is invalid."
              );
              return res.redirect("/forgot");
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, (err) => {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                user.save((err) => {
                  req.login(user, (err) => {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Passwords did not match");
              res.redirect(`/reset/${req.params.token}`);
            }
          }
        );
      },
      (user, done) => {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "infonodeapp@gmail.com",
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: "infonodeapp@gmail.com",
          subject: "Yelp Camp Password Reset",
          text:
            "This is a confirmation email to inform you that your password has been successfully changed!"
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash("success", "Password changed successfully!");
          done(err);
        });
      }
    ],
    (err) => res.redirect("/campgrounds")
  );
});

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/redirect",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureMessage: "Login unsuccessful, please try again"
  }),
  (req, res) => {
    req.flash("success", `Welcome to YelpCamp ${req.user.name}!`);
    res.redirect("/campgrounds");
  }
);

module.exports = router;
