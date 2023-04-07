var passport = require('passport');
var config = require('../config/database');
require('../config/Passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");
var Book = require("../models/book");

const bodyParser = require("body-parser");

// // parse requests of content-type - application/json
router.use(bodyParser.json());

const parser = bodyParser.urlencoded({ extended: true });

router.use(parser);

// router.post('/signup', async function (req, res) {

//     if (!req.body.username || !req.body.password) {
//         res.json({ success: false, msg: 'Please pass username and password.' });
//     } else {
//         var newUser = new User({
//             username: req.body.username,
//             password: req.body.password
//         });
//         // save the user
//         await newUser.save();

//         res.json({ success: true, msg: 'Successful created new user.' });
//     }
// });

router.post('/signin', async function (req, res) {

    console.log(req.body);

    let user = await User.findOne({ username: req.body.username });

    console.log(user);

    if (!user) {
        res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
    } else {
        // check if password matches
        user.comparePassword(req.body.password, function (err, isMatch) {
            if (isMatch && !err) {
                // if user is found and password is right create a token
                var token = jwt.sign(user.toJSON(), config.secret);
                // return the information including token as JSON
                res.json({ success: true, token: 'JWT ' + token });
            } else {
                res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
            }
        });
    }
});

router.post('/book', passport.authenticate('jwt', { session: false }), function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        console.log(req.body);
        var newBook = new Book({
            isbn: req.body.isbn,
            title: req.body.title,
            author: req.body.author,
            publisher: req.body.publisher
        });

        newBook.save()
            .then(() => res.json({ success: true, msg: 'Successful created new book.' }))
            .catch(err => res.json({ success: false, msg: 'Save book failed.' }));


    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
    }
});

router.get('/book', passport.authenticate('jwt', { session: false }), async function (req, res) {
    var token = getToken(req.headers);
    if (token) {
        let books = await Book.find();

        res.json(books);
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized.' });
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

//////////////////////////////////////////////////////////////

router.get('/signup', (req, res) => {
    res.render('signup');
})

router.get('/login', (req, res) => {
    const error = req.query.error;
    let checkUser = false, checkPassword = false, checkErr = false;

    if (error === 'user_not_found') {
        checkUser = true;
        checkErr = true;
    }
    if (error === 'wrong_password') {
        checkPassword = true;
        checkErr = true;
    }

    res.render('login', {
        err: checkErr,
        helpers: {
            showErr() {
                if (checkUser) {
                    return 'User not found';
                }
                if (checkPassword) {
                    return 'Wrong password';
                }
            },

        }
    });
})

router.post('/login', async (req, res) => {
    if (!req.body.username || !req.body.password) {
        res.json({ success: false, msg: 'Please pass username and password.' });
    } else {
        var newUser = new User({
            username: req.body.username,
            password: req.body.password
        });
        // save the user
        await newUser.save();

        // res.json({ success: true, msg: 'Successful created new user.' });
        res.render('login')
    }
})

// router.get('/home', async (req, res) => {
// var token = getToken(req.headers);
// if (token) {
//     let books = await Book.find();

//     res.json(books);
// } else {
//     return res.status(403).send({ success: false, msg: 'Unauthorized.' });
// }
// });

router.post('/home', async (req, res) => {
    console.log(req.body);
    let check = false;

    let user = await User.findOne({ username: req.body.username });

    // console.log(user);

    if (req.body.title != undefined) {
        check = true;

    } else {
        // res.status(401).send({ success: false, msg: 'Authentication failed. User not found.' });
        if (!user) {
            res.redirect('/api/login?error=user_not_found');
            return;
        }
    }
    if (!check) {
        // check if password matches
        user.comparePassword(req.body.password, async function (err, isMatch) {
            if (isMatch && !err) {
                // if user is found and password is right create a token
                var token = jwt.sign(user.toJSON(), config.secret);
                // return the information including token as JSON
                // res.json({ success: true, token: 'JWT ' + token });

                res.setHeader('Authorization', `${token}`);

                // res.render('home', { layout: 'home' })

                // var token = getToken(req.headers);
                // if (token) {
                check = true;
                // } else {
                //     return res.status(403).send({ success: false, msg: 'Unauthorized.' });
                // }

            } else {
                // res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' });
                res.redirect('/api/login?error=wrong_password');
            }
        });
    }
    else {
        // res.setHeader('Content-Type', 'application/json');

        var newBook = new Book({
            isbn: req.body.isbn,
            title: req.body.title,
            author: req.body.author,
            publisher: req.body.publisher
        });

        newBook.save();
        // .then(() => res.json({ success: true, msg: 'Successful created new book.' }))
        // .catch(err => res.json({ success: false, msg: 'Save book failed.' }));
    }

    setTimeout(async () => {
        if (check) {
            let books = await Book.find();

            // res.json(books);
            res.render('list', {
                layout: 'home',
                helpers: {
                    getList() {
                        let content = '';

                        for (let item of books) {
                            content += `${(JSON.stringify(item._id).split('"'))[1]}^${item.isbn}^${item.title}^${item.author}^${item.publisher}#`;
                        }

                        return content;
                    }
                }
            });
        }
    }, 10)
});

router.get('/add', async (req, res) => {
    res.render('add', { layout: 'home' })
})

module.exports = router;