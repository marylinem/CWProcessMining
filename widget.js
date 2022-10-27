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



    function strComp(strA, strB) {
        return strA < strB ? 1 : strA > strB ? -1 : 0;
    }


    let div = document.createElement("div");

    class JointJS extends HTMLElement {


        clearGraph() {
            this.graph.clear();
            this.nodes = new Map();
            this.relations = new Map();
        }

        constructGraph() {
            console.log("Drawing Graph")

            let nodeMap = new Map();


            this.nodes.forEach((n, k) => {
                let rect = new joint.shapes.standard.Rectangle();
                rect.resize(140, 40);

                rect.attr({
                    body: {
                        fill: 'blue'
                    },
                    label: {
                        text: n,
                        fill: 'white'
                    }
                });
                rect.addTo(this.graph);
                nodeMap.set(k, rect);
            })

            this.relations.forEach((r, v) => {
                var link = new joint.shapes.standard.Link();
                link.source(nodeMap.get(r.n0));
                link.target(nodeMap.get(r.n1));
                link.appendLabel({
                    attrs: {
                        text: {
                            text: "" + r.val
                        },
                        strokeLinejoin: 'round',
                        strokeLinecap: 'round',
                    }
                });
                link.addTo(this.graph);
            })
            this.graph.resetCells(this.graph.getCells());
            joint.layout.DirectedGraph.layout(this.graph, {
                nodeSep: 75,
                edgeSep: 100,
                rankDir: "TB"
            });
        }

        traverseEdge(n0, n1) {
            let key = n0 + "_" + n1;
            let val = 0;
            if (this.relations.get(key)) val = this.relations.get(key).val;
            this.relations.set(key, { val: val + 1, n0: n0, n1: n1 });
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
            let process = null;
            this.nodes.set("_start", "Start");
            this.nodes.set("_end", "End");
            data.forEach(row => {
                process = row.dimensions_0;
                let relation = row.dimensions_1;
                if (curRelationId == relation.id) {
                    this.traverseEdge(prevProcessData.id, process.id);
                    prevProcessData = process;
                }
                else {
                    if (curRelationId) this.traverseEdge(prevProcessData.id, "_end");
                    this.traverseEdge("_start", process.id);
                    curRelationId = relation.id;
                    prevProcessData = process;
                }
                this.nodes.set(process.id, process.label);
            });
            this.traverseEdge(process.id, "_end");
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

            this.paper.options.defaultConnector = {
                name: 'smooth'
            }

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