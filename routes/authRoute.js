const express = require('express');
const router = express.Router();
const passport = require('passport'); 
const User = require('../models/userModel');
const Joi = require('joi'); 
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
require('../utils/passportAuth');

// Middleware to ensure authentication
function ensureAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
}

// Middleware to ensure user is NOT authenticated
function ensureNotAuthentication(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('back');
    }
    next();
}

// Google Authentication Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 🟢 Google OAuth Callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login',
  })
);

// Logout Route
router.get('/logout', ensureAuthentication, (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.redirect('/');
        });
    });
});


const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format.',
    'any.required': 'Email is required.'
    }),
    password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long.',
    'any.required': 'Password is required.'
    }),
    password2: Joi.string().required().valid(Joi.ref('password')).messages({
    'any.only': 'Passwords do not match.',
    'any.required': 'Confirm password is required.'
    })
});



router.get('/register',ensureNotAuthentication,async(req,res,next)=>{

    res.render('register');


})

router.post('/register', ensureNotAuthentication, async (req, res, next) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) {
            req.flash('error', error.details.map(err => err.message));
            return res.render('register', { email: req.body.email, messages: req.flash() });
        }

        const { email } = req.body;
        if (await User.findOne({ where: { email } })) {
            req.flash('warning', 'Email already exists');
            return res.redirect('/auth/register');
        }

        const user = await User.create(req.body);
        req.flash('success', `${user.email} registered successfully. You can now login.`);
        res.redirect('/auth/login');
    } catch (error) {
        next(error);
    }
});

// Login Routes
router.get('/login', ensureNotAuthentication, (req, res) => {
    res.render('login');
});

router.post('/login', ensureNotAuthentication, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        req.session.regenerate((err) => {
            if (err) return next(err);
            req.login(user, (err) => {
                if (err) return next(err);
                req.session.user = user.id;
                req.session.save((err) => {  
                    if (err) return next(err); 
                    res.redirect('/'); 
            });
        });
    })(req, res, next);
})
});

// Forgot Password Routes
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

router.get('/verify-otp', (req, res) => {
    if (!req.session.email) {
        req.flash('error', 'Session expired. Please request OTP again.');
        return res.redirect('/auth/forgot-password');
    }
    res.render('verify-otp', { email: req.session.email });
});

// OTP and Password Reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            req.flash('error', 'No account found with that email.');
            return res.redirect('/auth/forgot-password');
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10-minute expiry
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const emailHtml = await ejs.renderFile(
            path.join(__dirname, '../views/email/password-reset.ejs'),
            { otp, year: new Date().getFullYear(), companyName: 'District D' }
        );

        await transporter.sendMail({
            from: '"Support" <support@example.com>',
            to: user.email,
            subject: 'Password Reset',
            html: emailHtml,
        });

        req.session.email = email;
        req.flash('success', 'Check your email for the OTP.');
        res.redirect('/auth/verify-otp');
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'Something went wrong.');
        res.redirect('/auth/forgot-password');
    }
});

const passwordSchema = Joi.object({
    newPassword: Joi.string().min(8).required()
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const { error } = passwordSchema.validate({ newPassword });
        if (error) {
            req.flash('error', error.details[0].message);
            return res.redirect('/auth/verify-otp');
        }

        const user = await User.findOne({ where: { email } });
        if (!user || Date.now() > new Date(user.otpExpiry).getTime() || user.otp !== otp) {
            req.flash('error', 'Invalid OTP or expired.');
            return res.redirect('/auth/forgot-password');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        req.flash('success', 'Password updated successfully.');
        res.redirect('/auth/login');
    } catch (error) {
        req.flash('error', 'Something went wrong.');
        res.redirect('/auth/forgot-password');
    }
});


module.exports = router;