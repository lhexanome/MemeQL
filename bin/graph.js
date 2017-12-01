const Graph = require('directed-graph');
const graphA = new Graph();

let test = {
    "url1": [
        [
            "s1",
            "p1",
            "s2"
        ],
        [
            "s2",
            "p2",
            "o2"
        ]
    ],
    "url2": [
        [
            "s2",
            "p1",
            "o3"
        ],
        [
            "s2",
            "p2",
            "o3"
        ]
    ]
};
function constructGraph(node) {

}
console.log(JSON.stringify(test));