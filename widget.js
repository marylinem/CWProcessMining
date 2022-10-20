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
        display: block;
        }
    </style> 
    <div id='diagram-container'></div>
    `;
    console.log("Loading Scripts")

    function loadScript(src) {
        let scripts = window.sessionStorage.getItem("customScripts") || []
        let stored = scripts.find((e) => e.scriptSrc == src);
        if (!stored) {
            let script = document.createElement("script")
            script.type = "text/javascript";
            script.src = src;
            script.defer = false;
            script.async = false;
            document.head.appendChild(script);

            let obj = {
                "src": src
            }
            scripts.push(obj);
        }
    }








    class JointJS extends HTMLElement {
        constructor() {
            super();
            let shadowRoot = this.attachShadow({ mode: "open" });
            shadowRoot.appendChild(template.content.cloneNode(true));
            this._props = {};
            this.addEventListener("click", event => {
                var event = new Event("onClick");
                this.dispatchEvent(event);
            });
            console.log("Constructing JointJS")

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

    loadScript("https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.js");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.js");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.4.1/backbone.js");
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/jointjs/3.5.5/joint.js");

    let scriptJoint = document.createElement("script")
    scriptJoint.onload = function () {
        console.log("Loaded JointJS")
        var namespace = joint.shapes;


        // var graph = new joint.dia.Graph({}, { cellNamespace: namespace });

        // var paper = new joint.dia.Paper({
        //     el: document.getElementById('diagram-container'),
        //     model: graph,
        //     width: 600,
        //     height: 600,
        //     gridSize: 1,
        //     cellViewNamespace: namespace
        // });

        // var rect = new joint.shapes.standard.Rectangle();
        // rect.position(100, 30);
        // rect.resize(100, 40);
        // rect.attr({
        //     body: {
        //         fill: 'blue'
        //     },
        //     label: {
        //         text: 'Hello',
        //         fill: 'white'
        //     }
        // });
        // rect.addTo(graph);

        // var rect2 = rect.clone();
        // rect2.translate(300, 0);
        // rect2.attr('label/text', 'World!');
        // rect2.addTo(graph);

        // var link = new joint.shapes.standard.Link();
        // link.source(rect);
        // link.target(rect2);
        // link.addTo(graph);
    }
    // document.head.appendChild(scriptJoint);
    customElements.define("com-demo-jointjs", JointJS);
    console.log("Loading JointJS")

})();