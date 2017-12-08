const express = require('express');
const router = express.Router();
const path = require('path');
const debug = require('debug')('MemeMQL:express');
const data = require('../data/d3_test_data');
const {constructJsonData} = require('../lib/graph.js');
const test = {
    "url1": [["s1", "p1", "o1"], ["s2", "p2", "s1"], ["s1", "p3", "s2"],["s1", "p4", "o1"]],
    "url2": [["s3", "p3", "o2"], ["s2", "p2", "o1"], ["s4", "p3", "o2"]]
};
/* GET home page. */
router.get('/', function (req, res, next) {
    debug("dirname : " + __dirname);
    res.sendFile(path.resolve(__dirname, '../views/index.html'));
});


/* GET users listing. */
router.get('/test', function (req, res, next) {
    console.log(constructJsonData(test['url1']));
    res.json(constructJsonData(test['url1']));
});

module.exports = router;
