const {constructGraph} = require('../lib/graph.js');
const {constructGraphs} = require('../lib/graph.js');
const {constructJsonData} = require('../lib/graph.js');
const test = {
    "url1": [["s1", "p1", "o1"], ["s2", "p2", "s1"], ["s1", "p3", "s2"]],
    "url2": [["s3", "p3", "o2"], ["s2", "p2", "o1"], ["s4", "p3", "o2"]]
};

console.log(constructJsonData(test['url1']));
