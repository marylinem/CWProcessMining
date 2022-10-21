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
    console.log("Loading Scripts")

    function loadScript(src, callback = null) {
        let scripts = window.sessionStorage.getItem("customScripts") || []
        let stored = scripts.find((e) => e.scriptSrc == src);
        if (!stored) {
            console.log("script not stored, creating")
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
        else {
            console.log("script stored")
        }
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
            let px = 10;
            let py = 10;
            let nodeMap = new Map();
            this.nodes.forEach((n, k) => {
                console.log(n);
                let rect = new joint.shapes.standard.Rectangle();
                rect.position(px, py);
                rect.resize(130, 40);
                py += 40;
                px += 40;
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
                        }
                    }
                });
                link.addTo(this.graph);
            })
        }

        changeModel() {
            if (!this.flowChartData.data || !this.flowChartData.data[0]
                || !this.flowChartData.data[0].dimensions_0
                || !this.flowChartData.data[0].dimensions_1) return;
            this.clearGraph();
            console.log("Constructing graph")
            console.log(this.flowChartData)
            let data = this.flowChartData.data;
            let cur = null;
            let prevData = null;
            data.forEach(row => {
                console.log(row);
                let d0id = row.dimensions_0.id;
                let d1 = row.dimensions_1;
                if (cur == d0id) {
                    let key = prevData.id + "_" + d1.id;
                    let val = 0;
                    if (this.relations.get(key)) val = this.relations.get(key).val;
                    this.relations.set(key, { val: val + 1, n0: prevData.id, n1: d1.id });
                    prevData = d1;
                }
                else {
                    cur = d0id;
                    prevData = d1;
                }
                this.nodes.set(d1.id, d1.label);
            });
            this.constructGraph();
        }

        constructor() {
            super();
            // let shadowRoot = this.attachShadow({ mode: "open" });

            this.appendChild(template.content.cloneNode(true));
            let container = this.appendChild(div.cloneNode(true));
            this._props = {};
            this.addEventListener("click", event => {
                var event = new Event("onClick");
                this.dispatchEvent(event);
            });
            console.log("Constructing JointJS")



            var namespace = joint.shapes;


            console.log(this)

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
            this.changeModel();
        }
    }

    // loadScript("https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.js");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.js");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.4.1/backbone.js");


    let scriptCB = function () {
        console.log("Loaded JointJS")
        customElements.define("com-demo-jointjs", JointJS);
    }
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.5.5/joint.js", scriptCB);

    console.log("Loading JointJS")

})();