const { Enhanser } = require('../lib/enhanser');
const debug = require('debug')('MemQL:test');

enhanser = new Enhanser();
var res = enhanser.enhanseUrls({
    "URL1" : {
        "mot1" : "<http://dbpedia.org/resource/Somerville_College,_Oxford>"
    }
});
debug (res);
