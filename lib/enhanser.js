const {SPARQL} = require("./sparql");
const debug = require('debug')('MemQL:test');

debug(SPARQL);
function extractEnhanse(url, sparql, query, uri) {
    return new Promise((resolve, reject) => {
        var callback = (res) => {
            resolve(res.length>0 ? {url,res} : null)
        };
        sparql._doQuery(query.replace(/\?uri/,uri),{
            success : (res) =>  resolve(res.length>0 ? {url,res} : null),
            failure : (err) =>  reject(err)
        },(data)=>{
            return data;
        })
        callback([]); // TODO!

    });
}
Enhanser = function () {
    this.query =
        "PREFIX : <http://dbpedia.org/resource/> " +
        "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> " +
        "PREFIX ont: <http://dbpedia.org/ontology/> " +
        "SELECT * WHERE { " +
        "?uri rdf:type ont:EducationalInstitution " +
        "?uri ?property ?hasValue " +
        "}"
    this.enhanseUrls = function (annotations) {

        const sparql = new SPARQL();
        const extract = [];
        for (const url in annotations) {
            const annotation = annotations[url];
            for (const keyword in annotation) {
                const uri = annotation[keyword];
                extract.push(extractEnhanse(sparql,url, uri));
            }
        }

        const results = Promise.all(extract).then();

        const enhanseUrls = {};

        results.forEach(result => {
            if (result === null) return;
            const urlData = enhanseUrls[result.url] || (enhanseUrls[result.url] = []);
            enhanseUrls[result.res].forEach(triplet => urlData.push(triplet));
        });

        return enhanseUrls;
    };
};
module.exports = {
    Enhanser
};