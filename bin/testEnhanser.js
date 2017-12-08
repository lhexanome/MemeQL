const { Enhancer } = require('../lib/enhancer');
const debug = require('debug')('MemQL:test');
const request = require("request-promise-native");

const enhancer = new Enhancer();

const res = enhancer.enhanceUrls({
    "URL1": {
        "mot1": "<http://dbpedia.org/resource/Somerville_College,_Oxford>"
    }
});
res.then(res => {
    console.log("ok!");
    console.log(res);
}).catch(console.error);