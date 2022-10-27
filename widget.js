(function () {
    let template = document.createElement("template");
    template.innerHTML = `
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.5.5/joint.css" />
    <style>
    :host {
        border-radius: 25px;
        border-width: 4px;
        border-color: black;
        border-style: solid;
        width: 500px;
        heihgt: 500px;
        display: block;
        }
        #diagram-container {
            width: 500px;
            height: 500px;
        }
    </style> 
    `;

    function loadScript(src, callback = null) {
        let scripts = window.sessionStorage.getItem("customScripts") || []
        let stored = scripts.find((e) => e.scriptSrc == src);
        if (!stored) {
            let script = document.createElement("script")
            script.type = "text/javascript";
            script.src = src;
            script.defer = false;
            script.async = false;
            if (callback) script.onload = callback;
            document.head.appendChild(script);

            let obj = {
                "src": src
            }
            scripts.push(obj);
        }
    }


    function getOutgoingEdges(n, edges) {
        const outgoing = [];
        for (const [key, e] of edges.entries()) {
            if (e.n0 == n) outgoing.push({ key: key, n0: e.n0, n1: e.n1 });
        }
        return outgoing;
    }

    function hasIncomingEdges(n, edges) {
        const incoming = [];
        for (const [key, e] of edges.entries()) {
            if (e.n1 == n) return true;
        }
        return false;
    }

    function isIndependent(prevNodes, node, edges) {
        for (const [key, e] of edges.entries()) {
            for (const n of prevNodes) {
                if (e.n1 == node && e.n0 == n) return false;
            }
        }
        return true;
    }

    function strComp(strA, strB) {
        return strA < strB ? 1 : strA > strB ? -1 : 0;
    }


    let div = document.createElement("div");

    class JointJS extends HTMLElement {



        /* 
        * Do a topological sort on nodes map
        * nodes map<string, string>: key: <id>, value: <label>
        * edges map<string, object>: key: <>, value: {n0, n1, value}; n0 - node with outgoing edge e
        * 
        */
        topologicalSort(nodes, edges) {
            const newNodes = [];
            const beginningNodes = [];
            // Get all beginning nodes
            for (const [n, label] of nodes.entries()) {
                let isBeginning = true;
                for (const e of edges.values()) {
                    if (e.n1 == n) {
                        isBeginning = false;
                        break;
                    }
                }
                if (isBeginning) beginningNodes.push({ id: n, label: label });
            }
            const edgeCopy = new Map(edges);
            // Topological Sorting with Kahn's algorithm
            while (beginningNodes.length > 0) {
                const n = beginningNodes.pop();
                newNodes.push({ id: n.id, label: n.label })
                const outgoing = getOutgoingEdges(n.id, edgeCopy);
                for (const e of outgoing) {
                    const m = e.n1;
                    edgeCopy.delete(e.key);
                    if (!hasIncomingEdges(m, edgeCopy)) beginningNodes.push({ id: m, label: nodes.get(m) });
                }
            }
            if (edgeCopy.size > 0) { // no topological sorting possible, sort by id
                console.log("No topological sort possible")
                newNodes = [];
                for (const [n, label] of nodes) {
                    newNodes.push({ id: n, label: label });
                }
                newNodes.sort((a, b) => strComp(a.id, b.id));
            }
            return newNodes;
        }

        clearGraph() {
            this.graph.clear();
            this.nodes = new Map();
            this.relations = new Map();
        }

        constructGraph() {
            console.log("Drawing Graph")
            let px = 10;
            let py = 10;
            let nodeMap = new Map();

            let sortedNodes = this.topologicalSort(this.nodes, this.relations)
            let prevNodes = [];

            sortedNodes.forEach(n => {
                let rect = new joint.shapes.standard.Rectangle();

                if (isIndependent(prevNodes, n.id, this.relations)) {
                    px += 150;
                }
                else {
                    py += 50;
                    px = 10;
                    prevNodes = [];
                }
                prevNodes.push(n.id);
                rect.position(px, py);
                rect.resize(130, 40);

                rect.attr({
                    body: {
                        fill: 'blue'
                    },
                    label: {
                        text: n.label,
                        fill: 'white'
                    }
                });
                rect.addTo(this.graph);
                nodeMap.set(n.id, rect);
            })

            this.relations.forEach((r, v) => {
                console.log({ r, v });
                var link = new joint.shapes.standard.Link();
                link.source(nodeMap.get(r.n0));
                link.target(nodeMap.get(r.n1));
                link.appendLabel({
                    attrs: {
                        text: {
                            text: "" + r.val
                        }
                    }
                });
                link.addTo(this.graph);
            })
        }

        /*
        * Creates model by traversing thorugh a sorted table with atleast 3 dimensions provided per row
        * Dimension 0: process
        * Dimension 1: relations
        * Dimension 2: timestamp
        * optional Dimension 3: filter
        * 
        */
        createModel() {
            // check if provided data has at least one row and three dimensions
            if (!this.flowChartData.data || !this.flowChartData.data[0]
                || !this.flowChartData.data[0].dimensions_0
                || !this.flowChartData.data[0].dimensions_1
                || !this.flowChartData.data[0].dimensions_2) return;
            this.clearGraph();
            console.log("Creating model")


            let data = Array.from(this.flowChartData.data);
            data.sort((a, b) => strComp(a.dimensions_1.id, b.dimensions_1.id) || strComp(b.dimensions_2.id, a.dimensions_2.id));
            console.log(data)
            let curRelationId = null;
            let prevProcessData = null;
            data.forEach(row => {
                let process = row.dimensions_0;
                let relation = row.dimensions_1;
                let filter = row.dimensions_3 || undefined;
                if (curRelationId == relation.id) {
                    let key = prevProcessData.id + "_" + process.id;
                    let val = 0;
                    if (this.relations.get(key)) val = this.relations.get(key).val;
                    this.relations.set(key, { val: val + 1, n0: prevProcessData.id, n1: process.id });
                    prevProcessData = process;
                }
                else {
                    curRelationId = relation.id;
                    prevProcessData = process;
                }
                this.nodes.set(process.id, process.label);
            });
            this.constructGraph();
        }

        constructor() {
            super();
            this.appendChild(template.content.cloneNode(true));
            let container = this.appendChild(div.cloneNode(true));
            this._props = {};
            this.addEventListener("click", event => {
                var event = new Event("onClick");
                this.dispatchEvent(event);
            });

            var namespace = joint.shapes;

            this.graph = new joint.dia.Graph({}, { cellNamespace: namespace });

            this.paper = new joint.dia.Paper({
                el: container,
                model: this.graph,
                width: 1200,
                height: 1200,
                gridSize: 1,
                cellViewNamespace: namespace
            });

        }
        onCustomWidgetBeforeUpdate(changedProperties) {
            this._props = { ...this._props, ...changedProperties };
        }
        onCustomWidgetAfterUpdate(changedProperties) {
            if ("color" in changedProperties) {
                this.style["background-color"] = changedProperties["color"];
            }
            if ("opacity" in changedProperties) {
                this.style["opacity"] = changedProperties["opacity"];
            }
            this.createModel();
        }
    }

    loadScript("https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.js");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.4.1/backbone.js");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/dagre/0.8.5/dagre.min.js");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/graphlib/3.0.1/graphlib.min.js");

    let scriptCB = function () {
        customElements.define("com-demo-jointjs", JointJS);
    }
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.5.5/joint.js", scriptCB);

})();