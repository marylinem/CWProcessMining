(function () {

    let template = document.createElement("template");
    template.innerHTML = `
    <button id="selModel" type="button">Select Model</button>
    <br>
    <br>
    <label for="selMeasure">Select Measure<br></label>
    <select id="selMeasure">
        <option>--NONE--</option>
    </select>
    <br>
    <br>
    <label for="selDim0">Select Process<br></label>
    <select id="selDim0">
        <option>--NONE--</option>
    </select>
    <br>
    <br>
    <label for="selDim1">Select Relation<br></label>
    <select id="selDim1">
        <option>--NONE--</option>
    </select>
    <br>
    <br>
    <label for="selDim2">Select Timestamp<br></label>
    <select id="selDim2">
        <option>--NONE--</option>
    </select>
    <br>
    <br>
    <button id="createModel" type="button" class="sapUiBtn">Create Model</button>
    <br>
    <br>
    <div>Choose Edge Label:</div>
    <select id="edgeLabel">
        <option value="amt">Amount</option>
        <option value="pct">Perecentile</option>
        <option value="avg">Average</option>
        <option value="med">Median</option>
        <option value="dev">Deviation</option>
        <option value="min">Min</option>
        <option value="max">Max</option>
    </select>
    <br>
    <button type="button" id="submitLabel">Set Label</button>
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

            this._shadowRoot.getElementById("submitLabel").onclick = (ev) => {
                ev.preventDefault();
                let label = this._shadowRoot.getElementById("edgeLabel").value;
                this.dispatchEvent(new CustomEvent("propertiesChanged", {
                    detail: {
                        properties: {
                            useLabel: label
                        }
                    }
                }));
            }
        }
        _submit(e) {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent("propertiesChanged", {
                detail: {
                    properties: {
                    }
                }
            }));
        }

        setOptions(dimensions, dim, newVal = undefined) {
            dim.options.length = dimensions.length + 1;
            const val = newVal || dim.value;
            dimensions.forEach((d, i) => {
                dim.options[i + 1] = new Option(d.description, d.id, undefined, d.id == val);
            });
        }

        async updateSelector(initialUpdate) {

        }

        async onCustomWidgetAfterUpdate() {
            console.log("onCustomWidget");
            if (this.dataBindings) {
                const db = this.dataBindings.getDataBinding('flowChartData');
                let dbDims = db.getDimensions("dimensions");
                let dbMeas = db.getMembers("measures");
                if (db) {
                    const ds = await db.getDataSource();
                    if (ds) {
                        const dimensions = await ds.getDimensions();
                        const measures = await ds.getMeasures();
                        const dim0 = this._shadowRoot.getElementById("selDim0");
                        const dim1 = this._shadowRoot.getElementById("selDim1");
                        const dim2 = this._shadowRoot.getElementById("selDim2");
                        const meas = this._shadowRoot.getElementById("selMeasure");

                        this.setOptions(dimensions, dim0, dbDims?.[0]);
                        this.setOptions(dimensions, dim1, dbDims?.[1]);
                        this.setOptions(dimensions, dim2, dbDims?.[2]);
                        this.setOptions(measures, meas, dbMeas?.[0]);
                    }
                }
            }
        }

        async createModel() {
            console.log("createModel");
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
                    const ds = await db.getDataSource();
                    const oldDims = db.getDimensions("dimensions");
                    console.log("OldDims:", oldDims);
                    await oldDims.forEach(async (id) => {
                        await db.removeDimension(id);
                    });
                    const oldMeas = db.getMembers("measures");
                    oldMeas.forEach(async (id) => {
                        await db.removeMember(id);
                    });

                    console.log("curDims:", db.getDimensions("dimensions"));
                    console.log("Adding: ", d0v, d1v, d2v);
                    await db.addMemberToFeed("measures", mv);
                    await db.addDimensionToFeed("dimensions", d0v, 0);
                    await db.addDimensionToFeed("dimensions", d1v, 1);
                    await db.addDimensionToFeed("dimensions", d2v, 2);
                    console.log("newDims:", db.getDimensions("dimensions"));
                }
            }
        }
    }
    customElements.define("com-demo-jointjs-builder",
        JointJSBuilderPanel);
})();
