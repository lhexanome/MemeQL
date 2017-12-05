const { extract } = require('../lib/extractor');
const debug = require('debug')('MemQL:test');

extract('ecole d\'ingénieur')
    .then(keywords => {
        debug(keywords)
    }).catch(debug);