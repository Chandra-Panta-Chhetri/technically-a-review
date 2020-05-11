const User = require("../models/user");
const Async = require("async");
const router = require("express").Router();
const passport = require("passport");
const nodemailer = require("nodemailer");
const middleware = require("../middleware");
const crypto = require("crypto");

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
    return res.redirect("/techProducts");
  }
);

router.get("/signup", middleware.hasLoggedIn, (req, res) =>
  res.render("user/signup", { pageName: "signup" })
);

router.get("/logout", middleware.isLoggedIn, (req, res) => {
  req.logout();
  req.flash("success", "Logged out successfully!");
  res.redirect("/techProducts");
});

router.get("/forgot", middleware.hasLoggedIn, (req, res) =>
  res.render("user/forgot")
);

router.post("/forgot", middleware.hasLoggedIn, (req, res) => {
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
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_PW
          }
        });
        var mailContent = `You or someone requested a password change for the user with username: ${user.email}.\nPlease click on the link below to reset your password:\nhttp://${req.headers.host}/reset/${token}\nNote: This link will expire in 15 mins.`;
        var mailOptions = {
          to: user.email,
          from: process.env.GMAIL_EMAIL,
          subject: "TECHnically A Review Password Reset",
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

router.get("/reset/:token", middleware.hasLoggedIn, async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      throw new Error();
    }
    return res.render("user/reset", { token: user.resetPasswordToken });
  } catch (e) {
    req.flash("error", "Password reset token has expired or is invalid.");
    return res.redirect("/forgot");
  }
});

router.post("/reset/:token", middleware.hasLoggedIn, (req, res) => {
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
              req.flash("error", "Passwords must match");
              res.redirect(`/reset/${req.params.token}`);
            }
          }
        );
      },
      (user, done) => {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_PW
          }
        });
        var mailOptions = {
          to: user.email,
          from: process.env.GMAIL_EMAIL,
          subject: "TECHnically A Review Password Changed",
          text:
            "This is a confirmation email to inform you that your password has been successfully changed!"
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash("success", "Password changed successfully!");
          done(err);
        });
      }
    ],
    (err) => res.redirect("/techProducts")
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
    req.flash("success", `Welcome ${req.user.name}!`);
    res.redirect("/techProducts");
  }
);

module.exports = router;
