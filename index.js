//var createError = require('http-errors');
var express = require('express');

var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/database');

var indexRouter = require('./router/index');
var usersRouter = require('./router/user');

var apiRouter = require('./router/api');


var hbs = require('express-handlebars')

var app = express();

app.use(express.urlencoded({
  extended: true,
}));
app.use(express.json());

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/api', apiRouter);

mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true });

// var cors = require('cors')

// app.use(cors());

app.use(passport.initialize());


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log('404 - Khong tim thay trang')
  next();
});

app.engine('hbs', hbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.set('views', 'views');

module.exports = app;

const port = 3000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});