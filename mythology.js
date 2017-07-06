const fs = require('fs');
const parser = require('./lang/parser.js');
const analyzer = require('./lang/analyzer.js');
const interpreter = require('./lang/interpreter.js');

const containsArg = arg => process.argv.slice(2).some(x => x === arg);

try {
    const source = fs.readFileSync(process.argv[2], 'utf8');
    const ast = parser(source);
    const analyzis = analyzer(ast);

    if (!analyzis.ok) {
        console.log(analyzis.message);
    } else if (containsArg('--ast')) {
        console.log(JSON.stringify(ast, null, 4));
    } else {
        interpreter(ast);
    }
} catch (e) {
    console.log('Exception');
    console.log(e);
}
