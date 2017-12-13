const express = require('express');
const router = express.Router();
const path = require('path');
const debug = require('debug')('MemeMQL:express');
const { constructJsonData } = require('../lib/graph.js');
const { extract } = require('../lib/extractor');
const { Enhancer } = require('../lib/enhancer');

const enhancer = new Enhancer();

/* GET home page. */
router.get('/', function (req, res, next) {
    debug("dirname : " + __dirname);
    res.sendFile(path.resolve(__dirname, '../views/index.html'));
});

// Async middleware
router.use(function (fn) {
    return (req, res, next) => {
        Promise
            .resolve(fn(req, res, next))
            .catch(next);
    }
});


/* GET users listing. */
router.get('/search', async function (req, res, next) {
    if (!req.query.q) {
        res.status(400).send('You must provide the `q` query parameter');
        return res.end();
    }

    const extractedData = await extract(req.query.q);

    const enhancedData = await enhancer.enhanceUrls(extractedData);

    const jsonGraph = constructJsonData(enhancedData);

    debug('Graph for search %s', req.query.q);
    res.json({
        graph: jsonGraph,
    });
});

module.exports = router;
