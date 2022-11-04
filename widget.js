(function () {
    let template = document.createElement("template");
    template.innerHTML = `
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.5.5/joint.css" />
    <div id="divDropdown">
    Select Edge-Label:
    <select id="edgeLabel">
        <option value="amt">#Cases</option>
        <option value="pct">Perecentile</option>
        <option value="avg">Duration (average)</option>
        <option value="med">Duration (median)</option>
        <option value="dev">Duration (deviation)</option>
        <option value="min">Duration (min)</option>
        <option value="max">Duration (max)</option>
    </select>
    </div>
    <input type="range" id="rangeMax" min="0" max="100" value="100">
    <label for="rangeMax">Max %</label>
    <input type="range" id="rangeMin" min="0" max="100" value="0">
    <label for="rangeMin">Min %</label>
    <style>
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


    let divGraph = document.createElement("div");

    class JointJS extends HTMLElement {


        clearGraph() {
            this.graph.clear();
            this.nodes = new Map();
            this.relations = new Map();
            this.pathFreq = new Map();
        }

        calculateStatistics() {
            this.relations.forEach(v => {
                let node = this.nodes.get(v.n0);
                let namount = node.amount;
                v.pct = v.val / namount;
                v.tavg = v.timeList.reduce((a, b) => a + b, 0) / v.val;
                v.timeList.sort();
                v.tmed = v.timeList[Math.floor(v.timeList.length / 2)] || 0;
                v.tdev = Math.sqrt(v.timeList.reduce((a, b) => a + (b - v.tavg) * (b - v.tavg), 0) / v.val);
                v.tmin = v.timeList.reduce((a, b) => Math.min(a, b), Infinity);
                v.tmax = v.timeList.reduce((a, b) => Math.max(a, b), -Infinity)
            });
        }

        round(val) {
            return Math.round(val * 10) / 10; //round to one decimal
        }

        getTimeLabel(t) {
            if (t == 0) return "-"
            if (t < 1000) return "" + t + "ms";
            if (t < 1000 * 60) return "" + this.round(t / 1000) + "s";
            if (t < 1000 * 60 * 60) return "" + this.round(t / 1000 / 60) + "min";
            if (t < 1000 * 60 * 60 * 24) return "" + this.round(t / 1000 / 60 / 60) + "h";
            if (t < 1000 * 60 * 60 * 24 * 365) return "" + this.round(t / 1000 / 60 / 60 / 24) + "d";
            return "" + this.round(t / 1000 / 60 / 60 / 24 / 365) + "yrs";
        }

        getEdgeLabel(edge) {
            if (this.useLabel == "amt") return "" + edge.val;
            if (this.useLabel == "pct") return "" + this.round(edge.pct);
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



            let pathAmount = 0;
            this.pathFreq.forEach((v) => {
                pathAmount += v;
            });



            let pathArr = Array.from(this.pathFreq.keys());

            console.log("PathArray before:", pathArr);

            let min = this.rangeMin.value / 100;
            let max = this.rangeMax.value / 100;

            pathArr = pathArr.filter((a) => {
                let p = this.pathFreq.get(a) / pathAmount;
                return p >= min && p <= max;
            });

            console.log("PathArray:", pathArr);
            // construct nodes and relations again from filtered paths

            let filteredNodes = new Map();
            let filteredRelations = new Map();
            let startNode = {
                id: "_start",
                label: "Start"
            }
            let endNode = {
                id: "_end",
                label: "End"
            }
            for (let path of pathArr) {
                let nodes = path.split(";");
                let first = true;
                let prevProcessData = null;
                let process = null;
                let last = false;
                for (let n of nodes) {
                    if (n == "") {
                        last = true;
                        break;
                    }
                    process = n;
                    path += process.id + ";";
                    if (!first) {
                        this.traverseEdgeImpl(filteredRelations, prevProcessData, process, 0); //TODO: find time dif
                    }
                    else {
                        this.visitNodeImpl(filteredNodes, startNode.id, startNode.label);
                        this.traverseEdgeImpl(filteredRelations, "_start", process, 0);
                        first = false;
                    }
                    prevProcessData = process;
                    this.visitNodeImpl(filteredNodes, process, this.nodes.get(process));
                }
                if (!last) {
                    this.traverseEdgeImpl(filteredRelations, process, "_end", 0);
                    this.visitNodeImpl(filteredNodes, endNode.id, endNode.label);
                }
            }


            filteredNodes.forEach((n, k) => {
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

            filteredRelations.forEach((r, v) => {
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

        traverseEdgeImpl(map, n0, n1, timeDif) {
            let key = n0 + "_" + n1;
            let val = 0;
            let timeList = new Array();
            let rel = map.get(key);
            if (rel) {
                val = rel.val;
                timeList = rel.timeList;
            }
            timeList.push(timeDif);
            map.set(key, { val: val + 1, n0: n0, n1: n1, timeList: timeList });
        }

        traverseEdge(n0, n1, timeDif) {
            this.traverseEdgeImpl(this.relations, n0, n1, timeDif);
        }

        visitNodeImpl(map, id, label) {
            let n = map.get(id);
            let amount = 0;
            if (n) {
                amount = n.amount;
            }
            map.set(id, { label: label, amount: amount + 1 });
        }

        visitNode(id, label) {
            this.visitNodeImpl(this.nodes, id, label);
        }


        visitPath(id) {
            let p = this.pathFreq.get(id);
            let amount = 0;
            if (p) amount = p;
            this.pathFreq.set(id, amount + 1);
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
            let startNode = {
                id: "_start",
                label: "Start"
            }
            let endNode = {
                id: "_end",
                label: "End"
            }
            let path = "";
            data.forEach(row => {
                process = row.dimensions_0;
                let relation = row.dimensions_1;
                let date = new Date(row.dimensions_2.id);

                if (curRelationId == relation.id) {
                    path += process.id + ";";
                    this.traverseEdge(prevProcessData.id, process.id, this.dateDif(prevDate, date));
                }
                else {
                    if (curRelationId) {
                        this.visitNode(endNode.id, endNode.label);
                        this.traverseEdge(prevProcessData.id, "_end", 0);
                        this.visitPath(path);
                    }
                    path = process.id + ";";
                    this.visitNode(startNode.id, startNode.label);
                    this.traverseEdge("_start", process.id, 0);
                    curRelationId = relation.id;
                }
                prevProcessData = process;
                prevDate = date;
                this.visitNode(process.id, process.label);
            });
            this.traverseEdge(process.id, "_end", 0);
            this.visitNode(endNode.id, endNode.label);
            this.visitPath(path);
            this.calculateStatistics();
            this.constructGraph();
        }

        constructor() {
            super();
            this._shadowRoot = this.attachShadow({ mode: "open" });
            this._shadowRoot.appendChild(template.content.cloneNode(true));


            this.rangeMin = this._shadowRoot.getElementById("rangeMin");
            this.rangeMax = this._shadowRoot.getElementById("rangeMax");

            let select = this._shadowRoot.getElementById("edgeLabel");
            select.addEventListener("change", () => {
                this.useLabel = select.value;
                this.graph.clear();
                this.constructGraph();
            });
            let container = this._shadowRoot.appendChild(divGraph.cloneNode(true));
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
                width: "100%",
                height: "100%",
                gridSize: 1,
                cellViewNamespace: namespace
            });

            this.paper.options.defaultConnector = {
                name: 'curve'
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
            //this.paper.setDimensions(width, height);

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