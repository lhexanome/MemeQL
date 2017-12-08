const Graph = require('directed-graph');

function constructGraph(graph){
    const constructed_graph = new Graph();
    for (triplet in graph) {
        if (graph.hasOwnProperty(triplet)) {
            const src = graph[triplet][0];
            const dest = graph[triplet][2];
            const pred = graph[triplet][1];
            constructed_graph.addVertex(src);
            constructed_graph.addVertex(dest);
            constructed_graph.addEdge(src,dest,pred);
        }
    }
    return constructed_graph;
}
function constructGraphs(object) {
    newObject = {};
    for (url in object) {
        if (object.hasOwnProperty(url)) {
            newObject[url] = constructGraph(object[url]);
        }
    }
    return newObject;
}
function constructJsonData(graph){
    newObject = {"nodes":[],"links":[]};
    for (triplet in graph) {
        if (graph.hasOwnProperty(triplet)) {
            const src = graph[triplet][0];
            const dest = graph[triplet][2];
            const pred = graph[triplet][1];
            if (newObject["nodes"].indexOf(src) === -1) {
                console.log()
                newObject["nodes"].push({"id":src,"group":1});
            }
            if (newObject["nodes"].indexOf(dest) === -1) {
                newObject["nodes"].push({"id":dest,"group":1});
            }
            newObject["links"].push({"source": src, "target": dest, "value": 1});
        }
    }
    return newObject;
}

module.exports = {
    constructGraph:constructGraph,
    constructGraphs:constructGraphs,
    constructJsonData:constructJsonData
};