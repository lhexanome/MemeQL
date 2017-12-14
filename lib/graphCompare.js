const debug = require('debug')('MemQL:graphCompare');

function compareListGraph(dicoGraph) {
    const output = [];
    for (const graph1 of Object.values(dicoGraph)) {
        const l = [];
        for (const graph2 of Object.values(dicoGraph)) {
            l.push(compareGraphValue(graph1.getGraph(), graph2.getGraph()));
        }
        output.push(l);
    }
    debug(output);
    return output;
}

function compareGraphValue(graph1, graph2) {

    const vertices1 = Object.keys(graph1);
    const vertices2 = Object.keys(graph2);

    if (graph1 === graph2) return 1;
    if (vertices1.length === 0 || vertices2.length === 0) return 0;

    let counterI = 0;
    let counterAll = 0;

    for (const vertex of vertices1) {
        if (vertices2.indexOf(vertex) !== -1) {
            counterI++;
        } else {
            counterAll++;
        }
        counterAll++;
    }

    for (const vertex of vertices1) {
        if (!graph1[vertex] || !graph2[vertex]) continue;

        const edges1 = Object.keys(graph1[vertex]);
        const edges2 = Object.keys(graph2[vertex]);

        if (edges1.length !== 0) {
            for (const edge of edges1) {
                if (edges2.indexOf(edge) !== -1) {
                    counterI++;
                }
                counterAll++;
            }
            for (const edge of edges2) {
                if (edges1.indexOf(edge) === -1) {
                    counterAll++;
                }
            }
        } else {
            counterAll += edges2.length;
        }

    }


    //debug("compare: g1=",graph1,"\n g2= ", graph2,"\n value: ",(counterI / counterAll),"inter= ",counterI,"union= ",counterAll);
    return (counterI / counterAll);

}

module.exports = { compareListGraph };