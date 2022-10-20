(function () {
    let template = document.createElement("template");
    template.innerHTML = `
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.5.5/joint.css" />
    <style>
    </style> 
    `;
    console.log("Loading Scripts")
    let scriptJQuery = document.createElement("script")
    scriptJQuery.type = "text/javascript";
    scriptJQuery.src = "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.js";
    scriptJQuery.defer = false;
    scriptJQuery.async = false;
    document.head.appendChild(scriptJQuery);

    let scriptLodash = document.createElement("script")
    scriptLodash.type = "text/javascript";
    scriptLodash.src = "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.js";
    scriptLodash.defer = false;
    scriptLodash.async = false;
    document.head.appendChild(scriptLodash);

    let scriptBackbone = document.createElement("script")
    scriptBackbone.type = "text/javascript";
    scriptBackbone.src = "https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.4.1/backbone.js";
    scriptBackbone.defer = false;
    scriptBackbone.async = false;
    document.head.appendChild(scriptBackbone);



    class JointJS extends HTMLElement {
        constructor() {
            super();
            let shadowRoot = this.attachShadow({ mode: "open" });
            shadowRoot.appendChild(template.content.cloneNode(true));
            this._props = {};
            console.log("Constructing JointJS")
            /*var namespace = joint.shapes;

            var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

            var paper = new joint.dia.Paper({
                el: this,
                model: graph,
                width: 600,
                height: 600,
                gridSize: 1,
                cellViewNamespace: namespace
            });

            var rect = new joint.shapes.standard.Rectangle();
            rect.position(100, 30);
            rect.resize(100, 40);
            rect.attr({
                body: {
                    fill: 'blue'
                },
                label: {
                    text: 'Hello',
                    fill: 'white'
                }
            });
            rect.addTo(graph);

            var rect2 = rect.clone();
            rect2.translate(300, 0);
            rect2.attr('label/text', 'World!');
            rect2.addTo(graph);

            var link = new joint.shapes.standard.Link();
            link.source(rect);
            link.target(rect2);
            link.addTo(graph);*/
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
        }
    }

    let scriptJoint = document.createElement("script")
    scriptJoint.type = "text/javascript";
    scriptJoint.src = "https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.5.5/joint.js";
    scriptJoint.defer = false;
    scriptJoint.async = false;
    scriptJoint.onload = function () {
        console.log("Loaded JointJS")
    }
    document.head.appendChild(scriptJoint);
    customElements.define("com-demo-jointjs", JointJS);
    console.log("Loading JointJS")

})();