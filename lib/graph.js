const Graph = require('directed-graph');
const debug = require('debug')('MemeMQL:graph');

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
    nodes = {};
    let i=0;
    let val=20;
    let valMax=val*5;
    for (triplet in graph) {
        if (graph.hasOwnProperty(triplet)) {
            const src = graph[triplet][0];
            const dest = graph[triplet][2];
            const pred = graph[triplet][1];
            if (nodes[src] === undefined) {
                newObject["nodes"].push({"id": i, "name": src, "citation": 10, "group": 1 });
                nodes[src]=src;
                i++;

            }
            if (nodes[dest] === undefined) {
                newObject["nodes"].push({"id": i, "name": dest, "citation": 10, "group": 1 });
                nodes[dest]=dest;
                i++;

            }
            newObject["links"].push({"source": findByid(newObject["nodes"],src), "target":findByid(newObject["nodes"],dest),"name": "A-B-1", "value": val,"group":1});
            if(val<valMax){
                val+=5;
            }else{
                val=10;
            }
        }
    }
    return newObject;
}
function findByid(list, id){
    console.log("list:",list,id);
    for (const obj of list){
        console.log("obj:",obj.name,id);

        if(obj.name==id){
            return obj.id;
        }
    }
    return null;
}
module.exports = {
    constructGraph:constructGraph,
    constructGraphs:constructGraphs,
    constructJsonData:constructJsonData
};


