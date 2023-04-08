var passport = require('passport');
var config = require('../config/database');
require('../config/Passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");
var Book = require("../models/book");

const bodyParser = require("body-parser");

const request = require('request');

// // parse requests of content-type - application/json
router.use(bodyParser.json());

const parser = bodyParser.urlencoded({ extended: true });

router.use(parser);

router.get('/signup', (req, res) => {
    res.render('signup')
});

router.post('/signup', async (req, res) => {
    // check username available
    let check = await User.findOne({ username: req.body.username })
        .lean()
        .exec();

    if (check) {
        return res.render("signup", {
            notify: "Username not available. Try another username"
        });
    }

    var newUser = new User({
        username: req.body.username,
        password: req.body.password,
    });

    // Save the user DB
    await newUser.save();

    return res.redirect("/api/login");
})

router.get('/login', (req, res) => {
    res.render('login');
})

router.post('/login', async (req, res) => {
    let user = await User.findOne({ username: req.body.username });
    console.log(req.body);
    // User not found
    if (!user) {
        return res.render("login", {
            notify: 'Authentication failed. User not found.',
        });
    } else {
        // check if password matches
        user.comparePassword(req.body.password, function (err, isMatch) {
            if (isMatch && !err) {
                // if user is found and password is right create a token
                var token = jwt.sign(user.toJSON(), config.secret);
                // return the information including token as JSON
                // res.json({ success: true, token: 'JWT ' + token });
                if (!req.session) {
                    req.session = {};
                }
                req.session.user = user.toObject();
                req.session.token = "JWT " + token;

                request.get('http://localhost:3000/api/list', {
                    headers: { 'Authorization': 'JWT ' + token }
                }, function (error, response, body) {
                    res.send(body);
                });

                //return res.redirect("/api/book");
            } else {
                return res.render("login", {
                    notify: "Authentication failed. Wrong password.",
                });
            }
        });
    }
})

router.get('/list', passport.authenticate("jwt", { session: false }), async (req, res) => {
    var token = getToken(req.headers);

    if (token) {
        let books = await Book.find({}).lean().exec();

        return res.render("list", {
            books,
            token: token,
            helpers: {
                inc(value) {
                    return parseInt(value) + 1;
                }
            }
        });
    } else {
        return res.redirect("/api/login");
    }
})

router.get('/list/add', (req, res) => {
    var token = getToken(req.headers);

    if (token) {
        res.render("add");
    } else {
        return res.redirect("/api/signin");
    }
})

router.post("/list", function (req, res) {
    passport.authenticate("jwt", { session: false });
    var token = req.session.token;
    if (token) {
        console.log(req.body);
        var newBook = new Book({
            isbn: req.body.isbn,
            title: req.body.title,
            author: req.body.author,
            publisher: req.body.publisher,
        });

        newBook
            .save()
            .then(() => {
                res.redirect("/");
            })
            .catch((e) => {
                res.json({ success: false, msg: "Save book failed." });
            });
    } else {
        return res.status(403).send({ success: false, msg: "Unauthorized." });
    }
});

getToken = function (headers) {
    if (headers && headers.authorization) {
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};

module.exports = router;