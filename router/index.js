var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Trang chu Express');
});

router.get('/signup', (req, res) => {
  res.render('signup');
})

router.get('/login', (req, res) => {
  res.render('login');
})

router.post('/login', (req, res) => {
  res.render('login');
})

module.exports = router;