const rpn = require('request-promise-native');

var cache = {};

function cachedRequest(options) {
    var htmlString;

    if (!cache[options])
    {
        htmlString = await rpn(options);
        cache[options] = htmlString;
    }
    else
    {
        htmlString = cache[options];
    }

    return htmlString;
}