let fs = require('fs');

exports.writeES6Class = function (fileName, start, end, es6class) {
    let content = fs.readFileSync(fileName, 'utf8');
    fs.writeFileSync(fileName, content.substring(0, start) + '\n\n' + es6class + '\n\n' + content.substring(end));
};
