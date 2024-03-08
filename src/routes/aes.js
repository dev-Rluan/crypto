var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/aes256', function(req, res, next) {
    res.render("aes256", { title: 'Your Fantasy' });    
});

module.exports = router;