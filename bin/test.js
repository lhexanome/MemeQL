const { extract } = require('../lib/extractor');
const debug = require('debug')('MemQL:test');

extract('école d\'ingénieur')
    .then(keywords => {
        debug(keywords)
    }).catch(debug);