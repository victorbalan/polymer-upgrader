## polymer-upgrader

usage:

node index.js <file_name>
opts:
    -w: write back to file

The script will replace this.$$('elem') with this.qs('elem') and this.$.elem with this.qs('#elem') and add a mixin to a BaseElementBehavior
which should contain the qs(querySelector) method (eg. this.shadowRoot.querySelector(arg)).
The base element behavior will be also added if fire event('fire') is used.

The script is a bit hardcoded so it will work only if the element has defined the properties before any methods.