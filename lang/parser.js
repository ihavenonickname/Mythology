const tokens = [
    {
        name: 'semicolon',
        pattern: /^;/
    },
    {
        name: 'comma',
        pattern: /^,/
    },
    {
        name: 'plus',
        pattern: /^\+/
    },
    {
        name: 'minus',
        pattern: /^-/
    },
    {
        name: 'asterisk',
        pattern: /^\*/
    },
    {
        name: 'slash',
        pattern: /^\//
    },
    {
        name: 'left parenthesis',
        pattern: /^\(/
    },
    {
        name: 'right parenthesis',
        pattern: /^\)/
    },
    {
        name: 'number literal',
        pattern: /^\d+(\.\d+)?/
    },
    {
        name: 'greater or equal',
        pattern: /^>=/
    },
    {
        name: 'less or equal',
        pattern: /^<=/
    },
    {
        name: 'less',
        pattern: /^</
    },
    {
        name: 'greater',
        pattern: /^>/
    },
    {
        name: 'bool literal',
        pattern: /^((true)|(false))\b/
    },
    {
        name: 'text literal',
        pattern: /^"[^"]*"/
    },
    {
        name: 'is keyword',
        pattern: /^is\b/
    },
    {
        name: 'isnt keyword',
        pattern: /^isnt\b/
    },
    {
        name: 'and keyword',
        pattern: /^and\b/
    },
    {
        name: 'or keyword',
        pattern: /^or\b/
    },
    {
        name: 'let keyword',
        pattern: /^let\b/
    },
    {
        name: 'assignment',
        pattern: /^=/
    },
    {
        name: 'while keyword',
        pattern: /^while\b/
    },
    {
        name: 'do keyword',
        pattern: /^do\b/
    },
    {
        name: 'end keyword',
        pattern: /^end\b/
    },
    {
        name: 'if keyword',
        pattern: /^if\b/
    },
    {
        name: 'else keyword',
        pattern: /^else\b/
    },
    {
        name: 'number keyword',
        pattern: /^number\b/
    },
    {
        name: 'bool keyword',
        pattern: /^bool\b/
    },
    {
        name: 'text keyword',
        pattern: /^text\b/
    },
    {
        name: 'not keyword',
        pattern: /^not\b/
    },
    {
        name: 'function keyword',
        pattern: /^function\b/
    },
    {
        name: 'return keyword',
        pattern: /^return\b/
    },
    {
        name: 'identifier',
        pattern: /^[a-zA-Z_]\w*/
    }
]

const semanticStack = [];

const removeComments = input => input.replace(/#.*/g, '');

const nextSymbol = input => {
    for (let token of tokens) {
        const res = token.pattern.exec(input);

        if (res !== null) {
            return {
                token: token,
                lexeme: res[0]
            };
        }
    }

    return null;
}

const symbolize = input => {
    const symbols = [];
    let inputTrimmed = removeComments(input);

    while (inputTrimmed.length > 0) {
        inputTrimmed = inputTrimmed.trim();

        const pos = input.length - inputTrimmed.length + 1;
        const symbol = nextSymbol(inputTrimmed);

        if (!symbol) {
            throw `Unexpected character at position ${pos}: ${inputTrimmed[0]}`;
        }

        symbol.position = pos;
        symbols.push(symbol);
        inputTrimmed = inputTrimmed.substring(symbol.lexeme.length);
    }

    return symbols;
}

let lastConsumedSymbol = null;

const tryConsume = tokenName => symbols => {
    if (symbols.length === 0) {
        return false;
    }

    if (symbols[0].token.name !== tokenName) {
        return false;
    }

    lastConsumedSymbol = symbols.shift();

    return true;
}

const consume = tokenName => symbols => {
    if (tryConsume(tokenName)(symbols)) {
        return;
    }

    if (symbols.length === 0) {
        throw 'Unexpected end of expression'
    }

    const s = symbols[0];

    throw `Unexpected token "${s.token.name}" at position ${s.position}: ${s.lexeme}. Expecting ${tokenName}`;
}

const accumulateBinaryExpression = operation => {
    const right = semanticStack.pop();
    const left = semanticStack.pop();

    semanticStack.push({
        construction: 'binary operation',
        operation: operation,
        left: left,
        right: right
    });
}

const statement = symbols => {
    if (symbols.length === 0) {
        return false;
    }

    switch (symbols[0].token.name) {
        case 'while keyword':
            whileStatement(symbols);
            return true;
        case 'if keyword':
            ifStatement(symbols);
            return true;
        case 'number keyword':
            variableDeclaration(symbols);
            return true;
        case 'bool keyword':
            variableDeclaration(symbols);
            return true;
        case 'text keyword':
            variableDeclaration(symbols);
            return true;
        case 'identifier':
            ambiguityAssignmentFunctionCall(symbols);
            return true;
        case 'return keyword':
            functionReturn(symbols);
            return true;
        default:
            return false;
    }
}

const ambiguityAssignmentFunctionCall = symbols => {
    if (symbols.length < 2) {
        throw 'Unexpected end of input';
    }

    if (symbols[1].token.name === 'assignment') {
        assignment(symbols);
    } else {
        functionCall(symbols)('statement');
    }
}

const ifStatement = symbols => {
    consume('if keyword')(symbols);

    expression(symbols);

    const condition = semanticStack.pop();

    consume('do keyword')(symbols);

    const _if = {
        construction: 'if statement',
        condition: condition,
        ifBody: [],
        elseBody: []
    }

    while (statement(symbols)) {
        _if.ifBody.push(semanticStack.pop());
    }

    if (tryConsume('else keyword')(symbols)) {
        while (statement(symbols)) {
            _if.elseBody.push(semanticStack.pop());
        }
    }

    consume('end keyword')(symbols);

    semanticStack.push(_if);
}

const whileStatement = symbols => {
    consume('while keyword')(symbols);

    expression(symbols);

    const condition = semanticStack.pop();

    consume('do keyword')(symbols);

    const _while = {
        construction: 'while statement',
        condition: condition,
        body: []
    }

    while (statement(symbols)) {
        _while.body.push(semanticStack.pop());
    }

    consume('end keyword')(symbols);

    semanticStack.push(_while);
}

const variableDeclaration = symbols => {
    let type = '';

    if (tryConsume('number keyword')(symbols)) {
        type = 'number'
    } else if (tryConsume('bool keyword')(symbols)) {
        type = 'bool'
    } else if (tryConsume('text keyword')(symbols)) {
        type = 'text'
    } else {
        throw 'Not a valid type: ' + symbols[0].lexeme
    }

    consume('identifier')(symbols);

    const identifier = lastConsumedSymbol.lexeme;

    consume("assignment")(symbols);

    expression(symbols);

    consume('semicolon')(symbols);

    const expr = semanticStack.pop();

    semanticStack.push({
        construction: 'variable declaration',
        type: type,
        identifier: identifier,
        expression: expr
    });
}

const assignment = symbols => {
    consume('identifier')(symbols);

    const identifier = lastConsumedSymbol.lexeme;

    consume('assignment')(symbols);

    expression(symbols);

    consume('semicolon')(symbols);

    const expr = semanticStack.pop();

    semanticStack.push({
        construction: 'assignment',
        identifier: identifier,
        expression: expr
    });
}

const functionCall = symbols => context => {
    consume('identifier')(symbols);

    const identifier = lastConsumedSymbol.lexeme;

    argumentList(symbols);

    if (context === 'statement') {
        consume('semicolon')(symbols);
    }

    const args = semanticStack.pop();

    semanticStack.push({
        construction: 'function call',
        context: context,
        identifier: identifier,
        args: args
    });
}

const functionReturn = symbols => {
    consume('return keyword')(symbols);

    const _return = {
        construction: 'return'
    };

    if (!tryConsume('semicolon')(symbols)) {
        expression(symbols);

        _return.expression = semanticStack.pop();

        consume('semicolon')(symbols);
    }

    semanticStack.push(_return);
}

const expression = symbols => {
    expressionLevel2(symbols);

    if (tryConsume('or keyword')(symbols)) {
        expressionLevel2(symbols);

        accumulateBinaryExpression('disjunction');
    }
}

const expressionLevel2 = symbols => {
    expressionLevel3(symbols);

    if (tryConsume('and keyword')(symbols)) {
        expressionLevel3(symbols);

        accumulateBinaryExpression('conjunction');
    }
}

const expressionLevel3 = symbols => {
    expressionLevel4(symbols);

    if (tryConsume('is keyword')(symbols)) {
        expressionLevel4(symbols);

        accumulateBinaryExpression('equality');
    } else if (tryConsume('isnt keyword')(symbols)) {
        expressionLevel4(symbols);

        accumulateBinaryExpression('inequality');
    }
}

const expressionLevel4 = symbols => {
    expressionLevel5(symbols);

    if (tryConsume('greater')(symbols)) {
        expressionLevel5(symbols);

        accumulateBinaryExpression('greater');
    } else if (tryConsume('greater or equal')(symbols)) {
        expressionLevel5(symbols);

        accumulateBinaryExpression('greater or equal');
    } else if (tryConsume('less')(symbols)) {
        expressionLevel5(symbols);

        accumulateBinaryExpression('less');
    } else if (tryConsume('less or equal')(symbols)) {
        expressionLevel5(symbols);

        accumulateBinaryExpression('less or equal');
    }
}

const expressionLevel5 = symbols => {
    expressionLevel6(symbols);

    while (true) {
        if (tryConsume('plus')(symbols)) {
            expressionLevel6(symbols);

            accumulateBinaryExpression('sum');
        } else if (tryConsume('minus')(symbols)) {
            expressionLevel6(symbols);

            accumulateBinaryExpression('subtraction');
        } else {
            break;
        }
    }
}

const expressionLevel6 = symbols => {
    expressionLevel7(symbols);

    while (true) {
        if (tryConsume('asterisk')(symbols)) {
            expressionLevel7(symbols);

            accumulateBinaryExpression('multiplication');
        } else if (tryConsume('slash')(symbols)) {
            expressionLevel7(symbols);

            accumulateBinaryExpression('division');
        } else {
            break;
        }
    }
}

const expressionLevel7 = symbols => {
    let operation = null;

    if (tryConsume('minus')(symbols)) {
        operation = 'negative';
    } else if (tryConsume('not keyword')(symbols)) {
        operation = 'negation';
    }

    expressionLevel8(symbols);

    if (operation) {
        const expr = semanticStack.pop();

        semanticStack.push({
            construction: 'unary operation',
            operation: operation,
            expression: expr
        });
    }
}

const expressionLevel8 = symbols => {
    if (tryConsume('left parenthesis')(symbols)) {
        expression(symbols);

        consume('right parenthesis')(symbols);

        return;
    }

    switch (symbols[0].token.name) {
        case 'number literal':
            numberLiteral(symbols);
            break;
        case 'bool literal':
            boolLiteral(symbols);
            break;
        case 'text literal':
            textLiteral(symbols);
            break;
        case 'identifier':
            ambiguityIdentifierFunctionCall(symbols);
            break;
        default:
            throw 'Invalid token, expecting literal or left parenthesis: ' + symbols[0];
    }
}

const numberLiteral = symbols => {
    consume('number literal')(symbols)

    semanticStack.push({
        construction: 'literal',
        value: lastConsumedSymbol.lexeme,
        type: 'number'
    });
}

const boolLiteral = symbols => {
    consume('bool literal')(symbols)

    semanticStack.push({
        construction: 'literal',
        value: lastConsumedSymbol.lexeme,
        type: 'bool'
    });
}

const textLiteral = symbols => {
    consume('text literal')(symbols)

    semanticStack.push({
        construction: 'literal',
        value: lastConsumedSymbol.lexeme.substring(1, lastConsumedSymbol.lexeme.length - 1),
        type: 'text'
    });
}

const ambiguityIdentifierFunctionCall = symbols => {
    if (symbols.length < 2) {
        throw 'Expecting left parenthesis or identifier';
    }

    if (symbols[1].token.name === 'left parenthesis') {
        functionCall(symbols)('expression');
    } else {
        consume('identifier')(symbols);

        semanticStack.push({
            construction: 'identifier',
            name: lastConsumedSymbol.lexeme
        });
    }
}

const argumentList = symbols => {
    consume('left parenthesis')(symbols);

    const args = [];

    if (!tryConsume('right parenthesis')(symbols)) {
        do {
            expression(symbols);

            args.push(semanticStack.pop());
        } while ((tryConsume('comma')(symbols)));

        consume('right parenthesis')(symbols);
    }

    semanticStack.push(args);
}

const typedArgumentList = symbols => {
    consume('left parenthesis')(symbols);

    const args = [];

    if (!tryConsume('right parenthesis')(symbols)) {
        let type = 'none';

        do {
            if (tryConsume('number keyword')(symbols)) {
                type = 'number';
            } else if (tryConsume('bool keyword')(symbols)) {
                type = 'bool';
            } else if (tryConsume('text keyword')(symbols)) {
                type = 'text';
            } else {
                throw `Expecting a type`;
            }

            consume('identifier')(symbols);

            args.push({
                name: lastConsumedSymbol.lexeme,
                type: type
            });
        } while ((tryConsume('comma')(symbols)));

        consume('right parenthesis')(symbols);
    }

    semanticStack.push(args);
}

const functionDeclaration = symbols => {
    if (!tryConsume('function keyword')(symbols)) {
        return false;
    }

    const _function = {
        construction: 'function'
    };

    consume('identifier')(symbols);

    _function.name = lastConsumedSymbol.lexeme;

    typedArgumentList(symbols);

    _function.args = semanticStack.pop();

    if (tryConsume('do keyword')(symbols)) {
        _function.type = 'none';
    } else {
        if (tryConsume('number keyword')(symbols)) {
            _function.type = 'number';
        } else if (tryConsume('bool keyword')(symbols)) {
            _function.type = 'bool';
        } else if (tryConsume('text keyword')(symbols)) {
            _function.type = 'text';
        } else {
            throw `In declaration of '${_function.name}', expecting a type, found ${symbols[0].token.name}`;
        }

        consume('do keyword')(symbols);
    }

    _function.body = [];

    while (!tryConsume('end keyword')(symbols)) {
        if (!statement(symbols)) {
            throw 'Not a valid statement: ' + symbols[0].lexeme;
        }

        _function.body.push(semanticStack.pop());
    }

    semanticStack.push(_function);

    return true;
}

const parse = input => {
    const symbols = symbolize(input);

    const program = {
        construction: 'program',
        functions: {}
    }

    while (symbols.length > 0) {
        if (!functionDeclaration(symbols)) {
            throw 'Not a valid function declaration: ' + symbols[0].lexeme;
        }

        const _function = semanticStack.pop();

        program.functions[_function.name] = _function;
    }

    return program;
}

module.exports = parse;
