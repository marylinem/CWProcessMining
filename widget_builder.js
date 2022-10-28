(function () {

    let template = document.createElement("template");
    template.innerHTML = `
    <button id="selModel" type="button">Select Model</button>
    <br/>
    <label for="selDim0">Select Process</label>
    <select id="selDim0">
        <option>--NONE--</option>
    </select>
    <br/>
    <label for="selDim1">Select Relation</label>
    <select id="selDim1">
        <option>--NONE--</option>
    </select>
    <br/>
    <label for="selDim2">Select Timestamp</label>
    <select id="selDim2">
        <option>--NONE--</option>
    </select>
    <br/>
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



            this._shadowRoot.getElementById("selModel").onclick = (ev) => {
                if (this.dataBindings) {
                    const db = this.dataBindings.getDataBinding('flowChartData');
                    if (db) {
                        db.openSelectModelDialog();
                    }
                }
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

        setOptions(dimensions, dim) {
            dim.options.length = dimensions.length;
            for (idx in dimensions) {
                dim.options[i] = new Option(dimensions[idx].id);
            }
        }

        async onCustomWidgetAfterUpdate(changedProperties) {
            if (this.dataBindings) {
                const db = await this.dataBindings.getDataBinding('flowChartData');
                if (db) {
                    const ds = await db.getDataSource();
                    if (ds) {
                        const dimensions = ds.getDimensions();
                        const dim0 = this._shadowRoot.getElementById("selDim0");
                        const dim1 = this._shadowRoot.getElementById("selDim1");
                        const dim2 = this._shadowRoot.getElementById("selDim2");
                        this.setOptions(dimensions, dim0);
                        this.setOptions(dimensions, dim1);
                        this.setOptions(dimensions, dim2);
                    }
                }
            }
        }
    }
    customElements.define("com-demo-jointjs-builder",
        JointJSBuilderPanel);
})();
