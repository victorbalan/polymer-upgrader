let configExtractor = require('./configExtractor');
let configWriter = require('./configWriter');
let es6Converter = require('./es6Converter');
let lebab = require('lebab');

if (process.argv.length < 3) {
    console.log('usage: node index.js <file_name> flags')
    return;
}
let fileName = '';
let writeFile = false;
let useLebab = false;
let useLebabUnsafe = false;
let returnUnshpe = false;
let printToConsole = false;
for (let i = 1; i < process.argv.length; i++) {
    let arg = process.argv[i];
    switch (arg) {
        case '-w':
            writeFile = true;
            break;
        case '-l':
            useLebab = true;
            break;
        case '-lu':
            useLebabUnsafe = true;
            break;
        case '-11':
            returnUnshpe = true;
            break;
        case '-p':
            printToConsole = true;
            break;
        default:
            fileName = arg;
    }
}
let polymerConfigs = configExtractor.extractJsonConfigFromPath(fileName);
if (returnUnshpe) {
    return 11;
}
for (let i = 0; i < polymerConfigs.length; i++) {
    let polymerConfig = polymerConfigs[i];
    console.log('running convertor for ', polymerConfig.path, ' with write file:', writeFile, 'use lebab: ', useLebab, 'use lebab unsafe: ', useLebabUnsafe);
    let es6class = es6Converter.convertToES6(polymerConfig);
    let safeLebab = ['arrow', 'for-of', 'for-each', 'arg-rest', 'arg-spread', 'obj-method', 'obj-shorthand', 'exponent', 'multi-var'];
    try {
        if (useLebab) {
            es6class = lebab.transform(es6class, safeLebab).code;
        }
        if (useLebabUnsafe) {
            es6class = lebab.transform(es6class, safeLebab.concat(['let'])).code;
        }
    } catch (e) {
        console.log('ERROR lebabbing', polymerConfig.path);
    }
    if (writeFile) {
        configWriter.writeES6Class(polymerConfig.path, polymerConfig.start, polymerConfig.end, es6class);
    }
    if (printToConsole) {
        log(polymerConfig.path);
        console.log(es6class);
        log(starify(polymerConfig.path));
    }
}

function log(msg) {
    let stars = '********************************';
    console.log(stars + msg + stars);
}

function starify(msg) {
    let str = '';
    for (let i = 0; i < msg.length; i++) {
        str = str + '*';
    }
    return str;
}