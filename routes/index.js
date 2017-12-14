const express = require('express');
const router = express.Router();
const path = require('path');
const debug = require('debug')('MemQL:express');
const { constructJsonData, constructGraphs } = require('../lib/graph.js');
const { extract } = require('../lib/extractor');
const { Enhancer } = require('../lib/enhancer');
const { compareListGraph } = require("../lib/graphCompare");

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

    const useCache = !!req.query.c;

    const extractedData = await extract(req.query.q, useCache);

    const enhancedData = await enhancer.enhanceUrls(extractedData, useCache);

    const matrixArray = constructGraphs(enhancedData);

    const jsonArray = constructJsonData(enhancedData);

    debug('Graph for search %s', req.query.q);
    debug('tableau', matrixArray);
    res.json({
        sites: jsonArray,
        matrix: compareListGraph(matrixArray)
    });
}));

router.use((err, req, res, next) => {
    debug('Error: ', err);
    res.status(500).end();
});

module.exports = router;
