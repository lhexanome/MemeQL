const { Enhanser } = require('../lib/enhanser');
const debug = require('debug')('MemQL:test');
const request = require("request-promise-native");

enhanser = new Enhanser();
try {
    const res =  enhanser.enhanseUrls({
        "URL1": {
            "mot1": "<http://dbpedia.org/resource/Somerville_College,_Oxford>"
        }
    });
    res.then(function (res) {
        console.log ("ok!");
        console.log (res);
    });
}catch (e){
    console.log (e);
}