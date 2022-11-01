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

        calculateStatistics() {
            this.relations.forEach(v => {
                v.pct = v.val / this.nodes.get(v.n0).amount;
                v.tavg = v.timeList.reduce((a, b) => a + b, 0) / v.val;
                v.timeList.sort();
                v.tmed = v.timeList[Math.floor(v.timeList.length / 2)] || 0;
                v.tdev = Math.sqrt(v.timeList.reduce((a, b) => a + (b - v.tavg) * (b - v.tavg), 0) / v.val);
                v.tmin = v.timeList.reduce((a, b) => Math.min(a, b), 0);
                v.tmax = v.timeList.reduce((a, b) => Math.max(a, b), 0)
            });
        }

        round(val) {
            return Math.round(val * 10) / 10; //round to one decimal
        }

        getTimeLabel(t) {
            /// (1000 * 60 * 60 * 24)
            if (t < 1000) return "" + t + "ms";
            if (t < 1000 * 60) return "" + this.round(t / 1000) + "s";
            if (t < 1000 * 60 * 60) return "" + this.round(t / 1000 / 60) + "min";
            if (t < 1000 * 60 * 60 * 24) return "" + this.round(t / 1000 / 60 / 60) + "h";
            if (t < 1000 * 60 * 60 * 24 * 365) return "" + this.round(t / 1000 / 60 / 60 / 24) + "d";
            return "" + this.round(t / 1000 / 60 / 60 / 24 / 365) + "yrs";
        }

        getEdgeLabel(edge) {
            if (this.useLabel == "amt") return "" + edge.val;
            if (this.useLabel == "pct") return "" + edge.pct;
            if (this.useLabel == "avg") return this.getTimeLabel(edge.tavg);
            if (this.useLabel == "med") return this.getTimeLabel(edge.tmed);
            if (this.useLabel == "dev") return this.getTimeLabel(edge.tdev);
            if (this.useLabel == "min") return this.getTimeLabel(edge.tmin);
            if (this.useLabel == "max") return this.getTimeLabel(edge.tmax);
            return "" + edge.val;
        }

        constructGraph() {
            console.log("Drawing Graph")

            let nodeMap = new Map();


            this.nodes.forEach((n, k) => {
                let rect = new joint.shapes.standard.Rectangle();
                rect.resize(140, 40);

                rect.attr({
                    body: {
                        strokeWidth: "1px",
                        stroke: "rgb(222, 222, 222)",
                        rx: "1px",
                        ry: "1px",
                    },
                    label: {
                        text: n.label,
                        fill: '#485c6b'
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
                            text: this.getEdgeLabel(r),
                            fill: "#346187",
                        },

                    }
                });
                link.attr({
                    strokeLinejoin: 'round',
                    strokeLinecap: 'round',
                    line: {
                        stroke: '#346187',
                        strokeWidth: '1px'
                    }
                })
                link.addTo(this.graph);
            })
            this.graph.resetCells(this.graph.getCells());
            joint.layout.DirectedGraph.layout(this.graph, {
                nodeSep: 75,
                edgeSep: 100,
                rankDir: "TB"
            });
        }

        traverseEdge(n0, n1, timeDif) {
            let key = n0 + "_" + n1;
            let val = 0;
            let timeList = new Array();
            let rel = this.relations.get(key);
            if (rel) {
                val = rel.val;
                timeList = rel.timeDif;
            }
            timeList.push(timeDif);
            this.relations.set(key, { val: val + 1, n0: n0, n1: n1, timeList: timeList });
        }

        visitNode(id, label) {
            let n = this.nodes.get(id);
            let amount = 0;
            if (n) {
                amount = n.amount;
            }
            this.nodes.set(id, { label: label, amount: amount });
        }

        dateDif(d1, d2) {
            return (d2.getTime() - d1.getTime());
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
            let prevDate = null;
            let process = null;
            this.nodes.set("_start", { label: "Start", amount: 0 });
            this.nodes.set("_end", { label: "End", amount: 0 });
            data.forEach(row => {
                process = row.dimensions_0;
                let relation = row.dimensions_1;
                let date = new Date(row.dimensions_2.id);
                if (curRelationId == relation.id) {
                    this.traverseEdge(prevProcessData.id, process.id, this.dateDif(prevDate, date));
                }
                else {
                    if (curRelationId) this.traverseEdge(prevProcessData.id, "_end", 0);
                    this.traverseEdge("_start", process.id, 0);
                    curRelationId = relation.id;
                }
                prevProcessData = process;
                prevDate = date;
                this.visitNode(process.id, process.label);
            });
            this.traverseEdge(process.id, "_end", 0);
            this.calculateStatistics();
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
            if ("useLabel" in changedProperties) {
                this.useLabel = changedProperties["useLabel"];
            }

            this.createModel();
        }

        onCustomWidgetResize(width, height) {
            this.paper.setDimensions(width, height);

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