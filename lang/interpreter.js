const readline = require('readline');

const defaultFunctions = {
    number_to_bool: (number => number !== 0),
    number_to_text: (number => number + ''),
    bool_to_number: (bool => bool ? 1 : 0),
    bool_to_text: (bool => bool + ''),
    text_to_number: (text => parseFloat(text)),
    text_to_bool: (text => text === 'true'),
    modulo: ((n1, n2) => n1 % n2),
    input: (() => readline()),
    print: (text => console.log(text))
};

const declaredFunctions = {};

const evalLiteral = ast => {
    switch (ast.type) {
        case 'number':
            return parseFloat(ast.value);
        case 'bool':
            return ast.value === 'true';
        case 'text':
            return ast.value;
        default:
            throw 'Not a valid type: ' + ast.type;
    }
}

const evalBinaryOperation = ast => environment => {
    const left = evaluate(ast.left)(environment);
    const right = evaluate(ast.right)(environment);

    switch (ast.operation) {
        case 'sum':
            return left + right;
        case 'subtraction':
            return left - right;
        case 'multiplication':
            return left * right;
        case 'division':
            return left / right;
        case 'equality':
            return left === right;
        case 'inequality':
            return left !== right;
        case 'greater':
            return left > right;
        case 'greater or equal':
            return left >= right;
        case 'less':
            return left < right;
        case 'less or equal':
            return left <= right;
        case 'conjuction':
            return left && right;
        case 'disjunction':
            return left || right;
        default:
            throw 'Bad binary operation: ' + ast.operation;
    }
}

const evalUnaryOperation = ast => environment => {
    const expr = evaluate(ast.expression)(environment);

    switch (ast.operation) {
        case 'negative':
            return -expr;
        default:
            throw 'Bad unary operation: ' + ast.operation;
    }
}

const evalFunctionCall = ast => environment => {
    const args = [];

    for (let arg of ast.args) {
        args.push(evaluate(arg)(environment));
    }

    if (defaultFunctions[ast.identifier]) {
        if (ast.context === 'expression') {
            return defaultFunctions[ast.identifier](...args);
        }

        defaultFunctions[ast.identifier](...args);

        return { returning: false };
    }

    const _function = declaredFunctions[ast.identifier];
    const newEnvironment = {};

    for (let arg of _function.args) {
        newEnvironment[arg.name] = args.shift();
    }

    if (ast.context === 'expression') {
        return evaluate(_function)(newEnvironment).value;
    }

    evaluate(_function)(newEnvironment);

    return { returning: false };
}

const evalVariableDeclaration = ast => environment => {
    environment[ast.identifier] = evaluate(ast.expression)(environment);

    return { returning: false };
}

const evalAssignment = ast => environment => {
    environment[ast.identifier] = evaluate(ast.expression)(environment);

    return { returning: false };
}

const evalIdentifier = ast => environment => {
    return environment[ast.name];
}

const evalIf = ast => environment => {
    let body = ast.elseBody;

    for (const branch of ast.conditionalBranches) {
        if (evaluate(branch.condition)(environment)) {
            body = branch.body;
            
            break;
        }
    }

    for (const member of body) {
        const evaluated = evaluate(member)(environment);

        if (evaluated.returning) {
            return evaluated;
        }
    }

    return { returning: false };
}

const evalWhile = ast => environment => {
    while (evaluate(ast.condition)(environment)) {
        for (let member of ast.body) {
            const evaluated = evaluate(member)(environment);

            if (evaluated.returning) {
                return evaluated;
            }
        }
    }

    return { returning: false };
}

const evalReturn = ast => environment => {
    return {
        returning: true,
        value: ast.expression ? evaluate(ast.expression)(environment) : null
    };
}

const evalFunction = ast => environment => {
    for (let member of ast.body) {
        const evaluated = evaluate(member)(environment);

        if (evaluated.returning) {
            return evaluated;
        }
    }

    return { returning: true };
}

const evaluate = ast => environment => {
    switch (ast.construction) {
        case 'literal':
            return evalLiteral(ast);
        case 'function call':
            return evalFunctionCall(ast)(environment);
        case 'unary operation':
            return evalUnaryOperation(ast)(environment);
        case 'binary operation':
            return evalBinaryOperation(ast)(environment);
        case 'variable declaration':
            return evalVariableDeclaration(ast)(environment);
        case 'assignment':
            return evalAssignment(ast)(environment);
        case 'identifier':
            return evalIdentifier(ast)(environment);
        case 'if statement':
            return evalIf(ast)(environment);
        case 'while statement':
            return evalWhile(ast)(environment);
        case 'return':
            return evalReturn(ast)(environment);
        case 'function':
            return evalFunction(ast)(environment);
        default:
            throw 'Undefined construction: ' + ast.construction;
    }
}

module.exports = ast => {
    for (let name of Object.keys(ast.functions)) {
        declaredFunctions[name] = ast.functions[name];
    }

    evaluate(declaredFunctions['main'])({});
}
