(function () {

    let template = document.createElement("template");
    template.innerHTML = `
    <button id="selModel" type="button">Select Model</button>
    <br/>
    <label for="selDim0">Select Process</label>
    <select id="selDim0"/>
    <br/>
    <label for="selDim1">Select Relation</label>
    <select id="selDim1"/>
    <br/>
    <label for="selDim2">Select Timestamp</label>
    <select id="selDim2"/>
    <style>
    :host {
    display: block;
    padding: 1em 1em 1em 1em;
    }
    </style>
    `;
    class JointJSBuilderPanel extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({ mode: "open" });
            this._shadowRoot.appendChild(template.content.cloneNode(true));

            // const db = this.dataBindings.getDataBinding("flowChartData");
            this._shadowRoot.getElementById("selModel").onclick = (ev) => {
                // db.openSelectModelDialog();
                this._submit(ev);
            };
        }
        _submit(e) {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent("propertiesChanged", {
                detail: {
                    properties: {
                        openDialog: true
                    }
                }
            }));
        }
    }
    customElements.define("com-demo-jointjs-builder",
        JointJSBuilderPanel);
})();
