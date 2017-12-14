const express = require('express');
const router = express.Router();
const path = require('path');
const debug = require('debug')('MemQL:express');
const { constructJsonData } = require('../lib/graph.js');
const { extract } = require('../lib/extractor');
const { Enhancer } = require('../lib/enhancer');
const {compareListGraph}= require("../lib/graphCompare");

const enhancer = new Enhancer();

/* GET home page. */
router.get('/', function (req, res, next) {
    debug("dirname : " + __dirname);
    res.sendFile(path.resolve(__dirname, '../views/index.html'));
});


// Async wrapper
function am(fn) {
    return (req, res, next) => {
        Promise
            .resolve(fn(req, res, next))
            .catch(next);
    }
}

/* GET users listing. */
router.get('/search', am(async function (req, res, next) {
    if (!req.query.q) {
        res.status(400).send('You must provide the `q` query parameter');
        return res.end();
    }

    const extractedData = await extract(req.query.q);

    const enhancedData = await enhancer.enhanceUrls(extractedData);

    const jsonArray = constructJsonData(enhancedData);

    debug('Graph for search %s', req.query.q);
    res.json({
        sites: jsonArray,
        matrix: compareListGraph(jsonArray)
    });
}));

router.use((err, req, res, next) => {
    debug('Error: ', err);
    res.status(500).end();
});

module.exports = router;
