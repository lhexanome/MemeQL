const debug = require('debug')('MemQL:graphCompare');

function compareListGraph(dicoGraph) {
    let list = [];
    let sortie = [];
    let keys = Object.keys(dicoGraph);
    for (const k of keys) {
        list.push(dicoGraph[k]);
    }
    for (const url of list) {
        let l = [];
        for (const url2 of list) {
            l.push(compareGraphValue(url, url2));
        }
        sortie.push(l);
    }
    debug(sortie);
    return sortie;
}

function compareGraphValue(graph1, graph2) {

    let vertices = Object.keys(graph1.getGraph());
    let vertices2 = Object.keys(graph2.getGraph());
    let compteurI = 0;
    let compteurTot = 0;
    let hasSameVertices = true;
    for (const vertex of vertices) {
        if (vertices2.indexOf(vertex) !== -1) {
            compteurI++;
        } else {
            hasSameVertices = false;
            compteurTot++;
        }
        compteurTot++;
    }
    if (hasSameVertices) {
        for (const vertex of vertices) {
            let edges = Object.keys(graph1.getGraph()[vertex]);
            let edges2 = Object.keys(graph2.getGraph()[vertex]);
            if(edges.length !==0) {
                for (const edge of edges) {
                    if (edges2.indexOf(edge) !== -1) {
                        compteurI++;
                    }
                    compteurTot++;
                }
                for (const edge of edges2) {
                    if (edges.indexOf(edge) === -1) {
                        compteurTot++;
                    }
                }
            }else{
                compteurTot+=edges2.length;
            }

        }

    }
    //debug("compare: g1=",graph1,"\n g2= ", graph2,"\n value: ",(compteurI / compteurTot),"inter= ",compteurI,"union= ",compteurTot);
    return (compteurI / compteurTot);

}

function compareGraph(graph1, graph2) {

    let vertices = Object.keys(graph1.getGraph());
    let vertices2 = Object.keys(graph2.getGraph());
    let hasSameVertices = true;
    for (const vertex of vertices) {
        if (vertices2.indexOf(vertex) === -1) {
            hasSameVertices = false;
        }
    }
    if (hasSameVertices) {
        //debug("same vertices");
        let hasSameEdges = true;
        for (const vertex of vertices) {
            let edges = Object.keys(graph1.getGraph()[vertex]);
            let edges2 = Object.keys(graph2.getGraph()[vertex]);
            for (const edge of edges) {
                if (edges2.indexOf(edge) === -1) {
                    hasSameEdges = false;
                }
            }
        }
        if (hasSameEdges) {
            //debug("same edges");
            return true;
        }
    }

}

module.exports = {compareListGraph};