let fs = require('fs');

exports.extractJsonConfigFromFile = function (fileName) {
    return this.extractJsonConfig(fs.readFileSync(fileName, 'utf8'));
};

exports.extractJsonConfig = function (content) {
    let parsedContent = findPolymerJSONConfig(content);
    let polymerPart = parsedContent.content;
    polymerPart = encapsulateArrayPropertyValueAsString(polymerPart, 'behaviors');
    polymerPart = encapsulateArrayPropertyValueAsString(polymerPart, 'observers');
    const propertiesTag = 'properties';
    if (polymerPart.indexOf(propertiesTag) > -1) {
        let fromIndex = polymerPart.indexOf(propertiesTag) + propertiesTag.length + 1;
        let toIndex = fromIndex + polymerPart.substring(fromIndex, fromIndex + polymerPart.substring(fromIndex).indexOf('function')).lastIndexOf('},') + 1;
        let replacedPart = polymerPart.substring(fromIndex, toIndex);
        replacedPart = trim(replacedPart);
        polymerPart = polymerPart.substring(0, fromIndex) + '"' + replacedPart + '"' + polymerPart.substring(toIndex);
    }
    return {
        start: parsedContent.start,
        end: parsedContent.end,
        config: new Function('var polymerConfig = ' + polymerPart + '\n return polymerConfig')(),
        originalContent: parsedContent.content
    };
};

function trim(str) {
    return str.replace(/[\t\n]+/g, ' ');
}

function findPolymerJSONConfig(content) {
    let polymerFunctionStart = 'Polymer(';
    let splitContent = content.split(polymerFunctionStart);
    if (splitContent.length < 1) {
        throw new Error('content does not contain \'' + polymerFunctionStart + '\'');
    }
    let startScriptTagIndex = splitContent[0].lastIndexOf('<script>') + '<script>'.length;
    let endScriptTagIndex = splitContent[0].length + polymerFunctionStart.length + splitContent[1].indexOf('</script>');
    let polymerPart = splitContent[1].split('</script>')[0];

    if (polymerPart.substring(polymerPart.length - 5, polymerPart.length - 1).indexOf('();') !== -1) {
        // is enclosed in function call
        polymerPart = polymerPart.substring(0, polymerPart.lastIndexOf('})();'));
    } else {
        // is NOT enclosed in function call
        polymerPart = polymerPart.substring(0, polymerPart.lastIndexOf('})'));
    }
    // remove last paranthesis from Polymer function call
    return {
        start: startScriptTagIndex,
        end: endScriptTagIndex,
        content: polymerPart.substring(0, polymerPart.lastIndexOf(')'))
    };
}

function encapsulateArrayPropertyValueAsString(polymerPart, tag) {
    if (!polymerPart || !tag) {
        throw new Error('encapsulatePropertyValueAsString error');
    }
    if (polymerPart.indexOf(tag) > -1) {
        let fromIndex = polymerPart.indexOf(tag) + tag.length + 1;
        let toIndex = fromIndex + polymerPart.substring(fromIndex).indexOf('],') + 1;
        return polymerPart.substring(0, fromIndex) + '"' + trim(polymerPart.substring(fromIndex, toIndex)) + '"' + polymerPart.substring(toIndex);
    } else {
        return polymerPart;
    }
}