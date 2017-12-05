const express = require('express');
const router = express.Router();
const path = require('path');
const debug = require('debug')('MemeMQL:express');
const data = require('../data/d3_test_data');

/* GET home page. */
router.get('/', function (req, res, next) {
    debug("dirname : " + __dirname);
    res.sendFile(path.resolve(__dirname, '../views/index.html'));
});


/* GET users listing. */
router.get('/test', function (req, res, next) {
    res.json(data);
});

module.exports = router;
