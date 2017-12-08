const request = require("request-promise-native");

async function extractEnhances(url, queryPattern, uris) {
    const query = queryPattern.replace(/\?uris/, uris.join(' '));
    console.log(query);
    const body = await request({
        method: "GET",
        uri: 'http://dbpedia.org/sparql',
        json: true,
        qs: {
            'default-graph-uri': "http://dbpedia.org",
            'query': query,
            'format': 'application/sparql-results+json',
            'timeout': 30000,

        }
    });

    const triplets = body.results.bindings.map(tuple => [tuple.uri.value, tuple.p.value, tuple.v.value]);
    const result = {};
    result[url] = triplets;
    return result;
}

class Enhancer {

    constructor() {
        this.queryPattern =
            "PREFIX : <http://dbpedia.org/resource/> " +
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> " +
            "PREFIX ont: <http://dbpedia.org/ontology/> " +
            "SELECT * WHERE { " +
            "?uri rdf:type ont:EducationalInstitution ." +
            "?uri ?p ?v " +
            "VALUES ?uri { ?uris }" +
            "}";
    }

    async enhanceUrls(annotations) {
        const extract = [];
        for (const url of Object.keys(annotations)) {
            const annotation = annotations[url];
            const uris = Object.values(annotation);

            extract.push(extractEnhances(url, this.queryPattern, uris));
        }

        const results = await Promise.all(extract);

        return results.reduce((i, e) => Object.assign(i, e))
    }
}

module.exports = {
    Enhancer
};