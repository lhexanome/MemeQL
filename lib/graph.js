const Graph = require('directed-graph');
const debug = require('debug')('MemQL:graph');

function constructGraph(graph) {
    const constructedGraph = new Graph();

    for (const [src, dest, pred] of Object.values(graph)) {
        constructedGraph.addVertex(src);
        constructedGraph.addVertex(dest);
        constructedGraph.addEdge(src, dest, pred);
    }

    return constructedGraph;
}

function constructGraphs(object) {
    const newObject = {};
    for (const url of Object.keys(object)) {
        newObject[url] = constructGraph(object[url]);
    }
    return newObject;
}

function constructJsonData(graph) {
    const allWebsite = [];

    for (const url of Object.keys(graph)) {

        const newObject = { nodes: [], links: [] };
        const nodes = {};

        let i = 0;
        let val = 20;
        const valMax = val * 5;

        allWebsite.push({ graph: newObject, url });

        for (const [src, dest, pred] of Object.values(graph[url])) {

            if (!nodes[src]) {
                newObject.nodes.push({
                    id: i,
                    name: src,
                    citation: 10,
                    group: 1
                });
                nodes[src] = true;
                i++;
            }

            if (!nodes[dest]) {
                newObject.nodes.push({
                    id: i,
                    name: dest,
                    citation: 10,
                    group: 1
                });
                nodes[dest] = true;
                i++;
            }

            newObject.links.push({
                source: findId(newObject.nodes, src),
                target: findId(newObject.nodes, dest),
                name: "D3_specific",
                value: val,
                group: 1
            });

            if (val < valMax) {
                val += 5;
            } else {
                val = 10;
            }
        }
    }
    return allWebsite;
}

function findId(list, name) {
    debug("List: ", list, name);
    return list.find(obj => obj.name === name).id;
}

module.exports = {
    constructGraph,
    constructGraphs,
    constructJsonData
};


