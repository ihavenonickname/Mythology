const fs = require('fs');
const parser = require('./lang/parser.js');
const analyzer = require('./lang/analyzer.js');
const interpreter = require('./lang/interpreter.js');

const main = () => {
    const args = process.argv.splice(2);

    if (args.length === 0 || args.length > 3) {
        console.log('node mythology <path to script> [--run|--ast]');

        return;
    }

    const source = fs.readFileSync(args[0], 'utf8');
    const ast = parser(source);

    if (args.indexOf('--ast') !== -1) {
        console.log(JSON.stringify(ast, null, 4));
    }

    if (args.indexOf('--run') !== -1) {
        interpreter(ast);
    }
}

try {
    main();
} catch (e) {
    console.log(e);
}
