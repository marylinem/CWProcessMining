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
    <button id="createModel" type="button">Create Model</button>
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
            this._shadowRoot.getElementById("createModel").onclick = (ev) => {
                this.createModel();
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
            dim.options.length = dimensions.length + 1;
            dimensions.forEach((d, i) => {
                dim.options[i + 1] = new Option(d.description, d.id);
            });
        }

        async onCustomWidgetAfterUpdate(changedProperties) {
            if (this.dataBindings) {
                const db = this.dataBindings.getDataBinding('flowChartData');
                if (db) {
                    const ds = await db.getDataSource();
                    if (ds) {
                        const dimensions = await ds.getDimensions();
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

        createModel() {
            const dim0 = this._shadowRoot.getElementById("selDim0");
            const dim1 = this._shadowRoot.getElementById("selDim1");
            const dim2 = this._shadowRoot.getElementById("selDim2");
            const d0v = dim0.value;
            const d1v = dim1.value;
            const d2v = dim1.value;
            if (this.dataBindings && d0v && d1v && d2v) {
                const db = this.dataBindings.getDataBinding('flowChartData');
                if (db) {
                    const oldDims = db.getDimensions("dimensions");
                    oldDims.forEach((id) => {
                        db.removeDimension(id);
                    });
                    db.addDimensionToFeed("dimensions", d0v, 0);
                    db.addDimensionToFeed("dimensions", d1v, 1);
                    db.addDimensionToFeed("dimensions", d2v, 2);
                }
            }
        }
    }
    customElements.define("com-demo-jointjs-builder",
        JointJSBuilderPanel);
})();
