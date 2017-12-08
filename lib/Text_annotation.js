const debug = require('debug')('MemeQL:text_annotation');
const rpn = require('request-promise-native');


async function extractURI(text, confidence, support) {
    debug(`text entry: ${text}, confidence ${confidence}, support ${support}`);

    try {
        const options = {
            uri: `http://model.dbpedia-spotlight.org/en/annotate?text=${encodeURIComponent(text)}&confidence=${encodeURIComponent(confidence)}&support=${encodeURIComponent(support)}`,

            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true // Automatically parses the JSON string in the response
        };
        const htmlString = await rpn(options);

        debug("output:", htmlString);
        const sortie = filterOutput(htmlString['Resources']);
        debug("sortie:", sortie)
        return sortie;
    } catch (exception) {
        debug(`error: ${exception}`);
    }
}

function filterOutput(output) {
    let sortie = [];
    for (const r of output) {
        const obj = { name: r['@surfaceForm'], URI: r['@URI'] };
        sortie.push(obj);
    }
    return sortie;
}

module.exports = { extractURI };