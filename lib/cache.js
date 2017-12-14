const request = require('request-promise-native');

const cache = {};

async function cachedRequest(options, useCache) {
    if (useCache && cache[options.uri]) {
        return cache[options.uri];
    }
    return cache[options.uri] = await request(options);
}

module.exports = cachedRequest;