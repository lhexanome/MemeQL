const request = require("request-promise-native");

function extractEnhanses(url, queryPattern, uris) {
    return new Promise((resolve, reject) => {
        var query = queryPattern.replace(/\?uris/, uris.join(' '));
        console.log(query);
        var resolve, reject;
        request(
            {
                method: "GET",
                uri: 'http://dbpedia.org/sparql',
                qs: {
                    'default-graph-uri': "http://dbpedia.org",
                    'query': query,
                    'format': 'application/sparql-results+json',
                    'timeout': 30000,

                }
            }, (error, response, bodyStr) => {
                console.error("response.statusCode", response && response.statusCode);
                if (response && response.statusCode >= 200 && response.statusCode < 400) {
                    var body = JSON.parse(bodyStr);
                    var triplers = body.results.bindings.map(tuple=>[tuple.uri.value,tuple.p.value,tuple.v.value]);
                    var resulte = {};
                    resulte[url] = triplers;
                    resolve(resulte);
                } else {
                    reject(error);
                }
            });
    });
}
Enhanser = function () {
    this.queryPattern =
        "PREFIX : <http://dbpedia.org/resource/> " +
        "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> " +
        "PREFIX ont: <http://dbpedia.org/ontology/> " +
        "SELECT * WHERE { " +
            "?uri rdf:type ont:EducationalInstitution ." +
            "?uri ?p ?v " +
            "VALUES ?uri { ?uris }"+
        "}"
    this.enhanseUrls = async function (annotations) {

        const extract = [];
        for (const url in annotations) {
            const annotation = annotations[url];
            var uris =[];
            for (const keyword in annotation)
                uris.push(annotation[keyword]);
            extract.push(extractEnhanses(url, this.queryPattern, uris));
        }

        const results = await Promise.all(extract);

        return results.reduce((i, e) => Object.assign(i, e))

    };
};
module.exports = {
    Enhanser
};