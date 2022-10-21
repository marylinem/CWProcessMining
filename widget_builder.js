(function () {
    let template = document.createElement("template");
    template.innerHTML = `
    <form id="form">
    <fieldset>
    <legend>JointJS Properties</legend>
    <table>
    </table>
    <input type="submit" style="display:none;">
    </fieldset>
    </form>
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

            this._shadowRoot.getElementById("form").addEventListener("submit",
                this._submit.bind(this));
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
    }
    customElements.define("com-demo-jointjs-builder",
        JointJSBuilderPanel);
})();
