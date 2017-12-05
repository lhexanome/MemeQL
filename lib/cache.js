const rpn = require('request-promise-native');

const cache = {};

async function cachedRequest(options) {
    return cache[options.uri] || (cache[options.uri] = await rpn(options));
}