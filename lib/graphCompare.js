const Graph = require('directed-graph');
const debug = require('debug')('MemeQL:graphCompare');

function compareGraph(graph1, graph2){

    let vertices = Object.keys(graph1.getGraph());
    let vertices2 = Object.keys(graph2.getGraph());
    let hasSameVertices=true;
    for(const vertex of vertices){
        if(vertices2.indexOf(vertex)==-1){
            hasSameVertices=false;
        }
    }
    if(hasSameVertices) {
        debug("same vertices");
        let hasSameEdges = true;
        for (const vertex of vertices) {
            let edges = Object.keys(graph1.getGraph()[vertex]);
            let edges2 = Object.keys(graph2.getGraph()[vertex]);
            for (const edge of edges) {
                if (edges2.indexOf(edge)==-1) {
                    hasSameEdges = false;
                }
            }
        }
        if(hasSameEdges) {
            debug("same edges");
            return true;
        }
    }

}
module.exports={compareGraph};