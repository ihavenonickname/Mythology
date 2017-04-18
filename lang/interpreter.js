const readline = require('readline');

const defaultEnvironment = () => {
    return {
        variables: {},
        functions: {
            number_to_bool: (number => number !== 0),
            number_to_text: (number => number + ''),
            bool_to_number: (bool => bool ? 1 : 0),
            bool_to_text: (bool => bool + ''),
            text_to_number: (text => parseFloat(text)),
            text_to_bool: (text => text === 'true'),
            modulo: ((n1, n2) => n1 % n2),
            input: (() => readline()),
            print: (text => console.log(text))
        }
    };
}

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

const evalFunctionCall = ast => environment => {
    const args = [];

    for (let arg of ast.args) {
        args.push(evaluate(arg)(environment));
    }

    if (ast.context === 'statement') {
        environment.functions[ast.identifier](...args);

        return;
    }

    if (ast.context === 'expression') {
        return environment.functions[ast.identifier](...args);
    }

    throw `Invalid context calling '${ast.identifier}': ${ast.context}`
}

const evalVariableDeclaration = ast => environment => {
    environment.variables[ast.identifier] = evaluate(ast.expression)(environment);
}

const evalAssignment = ast => environment => {
    environment.variables[ast.identifier] = evaluate(ast.expression)(environment);
}

const evalIdentifier = ast => environment => {
    return environment.variables[ast.name];
}

const evalIf = ast => environment => {
    const condition = evaluate(ast.condition)(environment);
    const body = condition ? ast.ifBody : ast.elseBody;

    for (let member of body) {
        evaluate(member)(environment);
    }
}

const evalWhile = ast => environment => {
    while (evaluate(ast.condition)(environment)) {
        for (let member of ast.body) {
            evaluate(member)(environment);
        }
    }
}

const evalProgram = ast => environment => {
    for (let member of ast.body) {
        evaluate(member)(environment);
    }
}

const evaluate = ast => environment => {
    switch (ast.construction) {
        case 'literal':
            return evalLiteral(ast);
        case 'function call':
            return evalFunctionCall(ast)(environment);
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
        case 'program':
            return evalProgram(ast)(environment);
        default:
            throw 'Undefined construction: ' + ast.construction;
    }
}

module.exports = ast => evaluate(ast)(defaultEnvironment());
