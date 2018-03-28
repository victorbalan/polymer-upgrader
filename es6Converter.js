let camelCase = require('to-camel-case');

exports.convertToES6 = function (data) {
    let config = data.config;
    let className = getClassName(config);

    let es6 = getClassDefinition(className, data);
    es6 = es6 + getStaticMethodWithReturn('is', '\'' + config.is + '\'');
    es6 = es6 + getStaticMethodWithReturn('properties', decodeURI(config.properties));
    es6 = es6 + getStaticMethodWithReturn('observers', config.observers);
    let listenersBlock = '';
    if (config.listeners) {
        for (let key in config.listeners) {
            if (!config.listeners.hasOwnProperty(key)) {
                continue;
            }
            listenersBlock = listenersBlock + 'this.addEventListener(\'' + key + '\', (e) => this.' + config.listeners[key] + '(e, e.detail));\n';
        }
    }
    let hasReady = false;
    for (let key in config) {
        if (!config.hasOwnProperty(key) || typeof config[key] !== 'function') {
            continue;
        }
        let fct = convertFunction(config[key].toString());
        if (key === 'ready') {
            hasReady = true;
            fct.body = 'super.ready();\n' + fct.body;
            if (listenersBlock) {
                fct.body = listenersBlock + fct.body;
            }
        }
        es6 = es6 + key + '' + fct.params + '\n{' + fct.body + '}\n';
    }
    if (listenersBlock && !hasReady) {
        es6 = es6 + 'ready()\n{\n' + listenersBlock + '\nsuper.ready();\n}\n';
    }

    es6 = es6 + '}\n\nwindow.customElements.define(' + className + '.is, ' + className + ');';
    es6 = es6.replace(/\$\$/g, 'qs');
    es6 = es6.replace(/\.\$\.([a-zA-Z0-9]+)/g, '.qs(\'#\$1\')');

    return es6;
};

function getStaticMethodWithReturn(name, stringValue) {
    if (!stringValue) {
        return '';
    }
    return 'static get ' + name + '() { \nreturn ' + stringValue + ';\n}\n'
}

function getClassDefinition(className, config) {
    let useBaseElementBehavior = false;
    if (config.originalContent.indexOf('$$') !== -1
        || config.originalContent.indexOf('.$') !== -1
        || config.originalContent.indexOf('fire') !== -1) {
        useBaseElementBehavior = true;
    }

    let definition = '';
    if (!config.config.behaviors && useBaseElementBehavior) {
        definition = 'Polymer.mixinBehaviors([window.Behaviors.BaseElementBehavior], Polymer.Element)';
    } else if (!config.config.behaviors && !useBaseElementBehavior) {
        definition = 'Polymer.Element'
    } else if (!!config.config.behaviors && !useBaseElementBehavior) {
        definition = 'Polymer.mixinBehaviors(' + config.config.behaviors + ', Polymer.Element)';
    } else {
        let behaviors = config.config.behaviors;
        let indexOfStart = behaviors.indexOf('[') + 1;
        behaviors = behaviors.substring(0, indexOfStart) + 'window.Behaviors.BaseElementBehavior, ' + behaviors.substring(indexOfStart);
        definition = 'Polymer.mixinBehaviors(' + behaviors + ', Polymer.Element)';
    }
    return 'class ' + className + ' extends ' + definition + ' {\n\n';
}

function getClassName(config) {
    if (!config.is) {
        throw new Error('element is is not defined');
    }
    let className = camelCase(config.is);
    return className.charAt(0).toUpperCase() + className.slice(1);
}

function convertFunction(functionString) {
    let indexOfSignature = functionString.indexOf('(');
    let params = functionString.substring(indexOfSignature, indexOfSignature + functionString.substring(indexOfSignature).indexOf(')')) + ')';
    let body = functionString.substring(functionString.indexOf('{') + 1, functionString.lastIndexOf('}'));
    return {
        params: params,
        body: body
    };
}
