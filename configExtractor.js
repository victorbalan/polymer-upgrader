let fs = require('fs');

exports.extractJsonConfigFromPath = function (path) {
    let configs = [];
    if (fs.lstatSync(path).isDirectory()) {
        let files = walkSync(path);
        for (let i = 0; i < files.length; i++) {
            try {
                // console.log('extracting json config for', files[i]);
                let config = this.extractJsonConfig(fs.readFileSync(files[i], 'utf8'));
                if (!config) {
                    continue;
                }
                config.path = files[i];
                configs.push(config);
            }catch(e) {
                console.log('failed for', files[i])
            }
        }

    } else {
        let config = this.extractJsonConfig(fs.readFileSync(path, 'utf8'));
        config.path = path;
        configs.push(config);
    }
    return configs;
};

exports.extractJsonConfig = function (content) {
    if (content.indexOf('<script>') === -1 ||
        content.indexOf('Polymer(') === -1) {
        return null
    }
    let parsedContent = findPolymerJSONConfig(content);
    let polymerPart = parsedContent.content;
    polymerPart = encapsulateArrayPropertyValueAsString(polymerPart, 'behaviors');
    polymerPart = encapsulateArrayPropertyValueAsString(polymerPart, 'observers');
    polymerPart = encapsulateProperties(polymerPart);
    fs.writeFileSync('test.js', 'var a = ' + polymerPart);
    return {
        start: parsedContent.start,
        end: parsedContent.end,
        config: new Function('var polymerConfig = ' + polymerPart + '\n return polymerConfig')(),
        originalContent: parsedContent.content
    };
};

function walkSync(dir, filelist) {
    let files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(dir + file).isDirectory()) {
            filelist = walkSync(dir + file + '/', filelist);
        }
        else {
            filelist.push(dir + file);
        }
    });
    return filelist;
}

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
    }
    return {
        start: startScriptTagIndex,
        end: endScriptTagIndex,
        // remove last paranthesis from Polymer function call
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

function encapsulateListeners(polymerPart) {
    if (!polymerPart) {
        throw new Error('encapsulatePropertyValueAsString error');
    }
    let tag = 'listeners';
    if (polymerPart.indexOf(tag) > -1) {
        let fromIndex = polymerPart.indexOf(tag) + tag.length + 1;
        let toIndex = fromIndex + polymerPart.substring(fromIndex).indexOf('}') + 1;
        return polymerPart.substring(0, fromIndex) + '"' + encodeURI(polymerPart.substring(fromIndex, toIndex)) + '"' + polymerPart.substring(toIndex);
    } else {
        return polymerPart;
    }
}

function encapsulateProperties(polymerPart) {
    let propertiesTag = 'properties:';
    if (polymerPart.indexOf(propertiesTag) > -1) {
        let fromIndex = polymerPart.indexOf(propertiesTag) + propertiesTag.length + 1;
        let afterPropertiesPart = polymerPart.substring(fromIndex);
        let notClosed = true;
        let open = 0;
        let closed = 0;
        let index = 0;
        while (notClosed) {
            if (afterPropertiesPart[index] === '{') {
                open++;
            } else if (afterPropertiesPart[index] === '}') {
                closed++;
            }
            if (open !== 0 && open === closed) {
                notClosed = false;
            }
            index++;
        }
        let replacedPart = encodeURI(afterPropertiesPart.substring(0, index));

        polymerPart = polymerPart.substring(0, fromIndex) + '"' + replacedPart + '"' + polymerPart.substring(afterPropertiesPart.substring(0, index).length + fromIndex);

    }
    return polymerPart;
}