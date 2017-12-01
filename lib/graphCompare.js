const Graph = require('directed-graph');
const debug = require('debug')('MemeQL:graphCompare');

function compareGraph(graph1, graph2){
    let vertices = Object.keys(graph1.getGraph());
    let vertices2 = Object.keys(graph1.getGraph());
    let hasSameVertices=true;
    for(let vertex in vertices){
        if(!vertices2.contains(vertex)){
            hasSameKeys=false;
        }
    }
    if(hasSameVertices) {
        debug("same vertices");
        let hasSameEdges = true;
        for (let vertex in vertices) {
            let edges = Object.keys(graph1.getValueFromName(vertex));
            let edges2 = Object.keys(graph2.getValueFromName(vertex));
            for (let edge in edges) {
                if (!edges2.contains(edge)) {
                    hasSameEdges = false;
                }
            }
        }
        if(hasSameEdges) {
            debug("same vertices");
        }
    }

}
module.exports={compareGraph};