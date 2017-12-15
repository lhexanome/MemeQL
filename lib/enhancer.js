const request = require('./cache');
const debug = require('debug')('MemQL:enhancer');


async function extractEnhances(url, queryPattern, uris, useCache) {
    const query = queryPattern.replace(/\$\$uris\$\$/, '<' + uris.join('> <') + '>');

    try {
        const bodyText = await request({
            method: "GET",
            uri: 'http://dbpedia.org/sparql',
            qs: {
                'default-graph-uri': "http://dbpedia.org",
                query,
                'format': 'application/sparql-results+json',
                'timeout': 30000,

            }
        }, useCache);

        const body = JSON.parse(bodyText);

        const triplets = body.results.bindings.map(tuple => [tuple.uri.value, tuple.p.value, tuple.v.value]);

        return {
            [url]: triplets
        }
    } catch (e) {
        debug('Error while enhancing (SPARQL) : %s', e.message);
        return {};
    }
}

class Enhancer {

    constructor(prefix, properties) {

        this.prefix = prefix || [
            { prefix: "owl", value: "http://www.w3.org/2002/07/owl#" },
            { prefix: "rdf", value: "http://www.w3.org/1999/02/22-rdf-syntax-ns#" },
            { prefix: "rdfs", value: "http://www.w3.org/2000/01/rdf-schema#" },
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

        this.types = [
            '<https://www.wikidata.org/wiki/Q3592593>',
        ];

        const header = this.prefix.reduce((i, e) => `${i}PREFIX ${e.prefix}: <${e.value}>\n`, '');

        this.queryPattern =
            `${header}
            SELECT * WHERE { 
                ?uri ?p ?v 
                VALUES ?uri { $$uris$$ } 
                VALUES ?p {
                    ${this.properties.join(" ")}
                }
            }`;
    }

    async enhanceUrls(annotations, useCache) {
        const extract = [];
        for (const url of Object.keys(annotations)) {
            const annotation = annotations[url];
            const uris = Object.values(annotation);

            extract.push(extractEnhances(url, this.queryPattern, uris, useCache)
                .catch(err => {
                    debug('Error requesting for enhancer', err);
                })
            );
        }

        const results = await Promise.all(extract);

        return results.reduce((i, e) => Object.assign(i, e), {});
    }
}

module.exports = {
    Enhancer
};