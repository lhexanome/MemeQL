const request = require("request-promise-native");


async function extractEnhances(url, queryPattern, uris) {
    const query = queryPattern.replace(/\?uris/, '<' + uris.join('> <') + '>');
    const bodyTxt = await request({
        method: "GET",
        uri: 'http://dbpedia.org/sparql',
        qs: {
            'default-graph-uri': "http://dbpedia.org",
            'query': query,
            'format': 'application/sparql-results+json',
            'timeout': 30000,

        }
    });
    const body = JSON.parse(bodyTxt);
    const triplets = body.results.bindings.map(tuple => [tuple.uri.value, tuple.p.value, tuple.v.value]);
    const result = {};
    result[url] = triplets;
    return result;
}

class Enhancer {

    constructor(prefix, properties) {

        this.prefix = prefix || [
            { prefix: "owl", value: "http://www.w3.org/2002/07/owl#" },
            { prefix: "rdf", value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#" },
            { prefix: "foaf", value: "http://xmlns.com/foaf/0.1/" },
            { prefix: "", value: "http://dbpedia.org/resource/" },
            { prefix: "dbpedia2", value: "http://dbpedia.org/property/" },
            { prefix: "ont", value: "http://dbpedia.org/ontology/" }
        ];
        this.properties = properties || [
            "dbpedia2:longitude",
            "dbpedia2:latitude",
            "dbpedia2:established",
            "dbpedia2:author",
            "dbpedia2:country",
            "dbpedia2:closed",
            "dbpedia2:institutions",
            "foaf:name",
            "ont:affiliation",
            "ont:city",
            "ont:country",
            "ont:category",
            "ont:sisterCollege",
            "ont:formerName",
            "ont:location",
            "ont:isPartOf",
            "ont:numberOfStudents",
            "ont:staff",
            "ont:wikiPageRedirects",
            "ont:type",
            "owl:sameAs",
            "rdf:type",
            "<http://purl.org/linguistics/gold/hypernym>",
            "<http://purl.org/dc/terms/subject>"
        ];
        this.queryPattern =
            this.prefix.reduce((i, e) => i + "PREFIX " + e['prefix'] + ": <" + e['value'] + "> ", "") +
            "SELECT * WHERE { " +
            "?uri rdf:type ont:EducationalInstitution ." +
            "?uri ?p ?v " +
            "VALUES ?uri { ?uris }" +
            "VALUES ?p{" + this.properties.join(" ") + "}" +
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