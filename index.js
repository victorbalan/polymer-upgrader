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
        default:
            fileName = arg;
    }
}
console.log('running convertor for ', fileName, ' with write file:', writeFile, 'use lebab: ', useLebab, 'use lebab unsafe: ', useLebabUnsafe);

let polymerConfig = configExtractor.extractJsonConfigFromFile(fileName);
let es6class = es6Converter.convertToES6(polymerConfig);
let safeLebab = ['arrow', 'for-of', 'for-each', 'arg-rest', 'arg-spread', 'obj-method', 'obj-shorthand', 'exponent', 'multi-var'];
if(useLebab) {
    es6class = lebab.transform(es6class, safeLebab).code;
}
if(useLebabUnsafe) {
    es6class = lebab.transform(es6class, safeLebab.concat(['let'])).code;
}
if (writeFile) {
    configWriter.writeES6Class(fileName, polymerConfig.start, polymerConfig.end, es6class);
} else {
    console.log(es6class);
}