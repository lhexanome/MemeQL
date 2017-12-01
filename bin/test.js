const { extractFromGoogle, extractKeywords } = require('../lib/extractor');
const debug = require('debug')('MemQL:test');

extractFromGoogle('java android null pointer exception')
    .then(res => extractKeywords(res[0]))
    .then(res => {
        debug('Extracted keywords :', res);
    }).catch(debug);