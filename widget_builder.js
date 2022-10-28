(function () {

    let template = document.createElement("template");
    template.innerHTML = `
    <button id="selModel" type="button">Select Model</button>
    <br/>
    <label for="selMeasure">Select Measure</label>
    <select id="selMeasure">
        <option>--NONE--</option>
    </select>
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
            this._shadowRoot.getElementById("createModel").onclick = async (ev) => {
                await this.createModel();
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
            const val = dim.value;
            dimensions.forEach((d, i) => {
                dim.options[i + 1] = new Option(d.description, d.id, undefined, d.id == val);
            });
        }

        async onCustomWidgetAfterUpdate(changedProperties) {
            if (this.dataBindings) {
                const db = this.dataBindings.getDataBinding('flowChartData');
                console.log(db.getDimensions("dimensions"));
                console.log(db.getMembers("measures"));
                if (db) {
                    const ds = await db.getDataSource();
                    if (ds) {
                        const dimensions = await ds.getDimensions();
                        const measures = await ds.getMeasures();
                        const dim0 = this._shadowRoot.getElementById("selDim0");
                        const dim1 = this._shadowRoot.getElementById("selDim1");
                        const dim2 = this._shadowRoot.getElementById("selDim2");
                        const meas = this._shadowRoot.getElementById("selMeasure");
                        this.setOptions(dimensions, dim0);
                        this.setOptions(dimensions, dim1);
                        this.setOptions(dimensions, dim2);
                        this.setOptions(measures, meas);

                        await ds.expandNode(dim2);
                    }
                }
            }
        }

        async createModel() {
            const dim0 = this._shadowRoot.getElementById("selDim0");
            const dim1 = this._shadowRoot.getElementById("selDim1");
            const dim2 = this._shadowRoot.getElementById("selDim2");
            const meas = this._shadowRoot.getElementById("selMeasure");
            const d0v = dim0.value;
            const d1v = dim1.value;
            const d2v = dim2.value;
            const mv = meas.value;
            if (this.dataBindings && d0v && d1v && d2v && mv) {
                const db = this.dataBindings.getDataBinding('flowChartData');
                if (db) {
                    const oldDims = db.getDimensions("dimensions");
                    oldDims.forEach(async (id) => {
                        await db.removeDimension(id);
                    });
                    const oldMeas = db.getMembers("measures");
                    oldMeas.forEach(async (id) => {
                        await db.removeMember(id);
                    });
                    await db.addMemberToFeed("measures", mv);
                    await db.addDimensionToFeed("dimensions", d0v);
                    await db.addDimensionToFeed("dimensions", d1v);
                    await db.addDimensionToFeed("dimensions", d2v);
                }
            }
        }
    }
    customElements.define("com-demo-jointjs-builder",
        JointJSBuilderPanel);
})();
