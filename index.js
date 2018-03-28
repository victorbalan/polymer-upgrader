let configExtractor = require('./configExtractor');
let configWriter = require('./configWriter');
let es6Converter = require('./es6Converter');

if (process.argv.length < 3) {
    console.log('usage: node index.js <file_name> flags')
    return;
}
let fileName = '';
let writeFile = false;
for (let i = 1; i < process.argv.length; i++) {
    let arg = process.argv[i];
    switch (arg) {
        case '-w':
            writeFile = true;
            break;
        default:
            fileName = arg;
    }
}
console.log('running convertor for ' + fileName + ' with write file:' + writeFile);

let polymerConfig = configExtractor.extractJsonConfigFromFile(fileName);
let es6class = es6Converter.convertToES6(polymerConfig);
if (writeFile) {
    configWriter.writeES6Class(fileName, polymerConfig.start, polymerConfig.end, es6class);
} else {
    console.log(es6class);
}