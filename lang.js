const tokens = [
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
        name: 'number',
        pattern: /^\d+(\.\d+)?/
    },
    {
        name: 'equal',
        pattern: /^==/
    },
    {
        name: 'different',
        pattern: /^!=/
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
        name: 'and',
        pattern: /^&&/
    },
    {
        name: 'or',
        pattern: /^\|\|/
    }
]

const semanticStack = [];

const symbolize = input => {
    const symbols = [];
    let inputTrimmed = input.trim();

    while (inputTrimmed.length > 0) {
        inputTrimmed = inputTrimmed.trim();

        const oldLength = symbols.length;
        let pos = input.length - inputTrimmed.length + 1;

        for (let token of tokens) {
            const res = token.pattern.exec(inputTrimmed);

            if (res !== null) {
                inputTrimmed = inputTrimmed.substring(res[0].length);

                symbols.push({
                    token: token,
                    lexeme: res[0],
                    position: pos
                });

                break;
            }
        }

        if (oldLength === symbols.length) {
            throw `Unexpected character at position ${pos}: ${inputTrimmed[0]} `;
        }
    }

    return symbols;
}

const tryConsume = tokenName => symbols => {
    if (symbols.length === 0) {
        return false;
    }

    if (symbols[0].token.name !== tokenName) {
        return false;
    }

    symbols.shift();

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

    throw `Unexpected token "${s.token.name}" at position ${s.position}: ${s.lexeme}`;
}

const accumulateBinaryExpression = operator => {
    const right = semanticStack.pop();
    const left = semanticStack.pop();

    semanticStack.push({
        construction: 'expression',
        operator: operator,
        left: left,
        right: right
    });
}

const logicExpression = (symbols) => {
    logicExpressionLevel2(symbols);

    if (tryConsume('or')(symbols)) {
        logicExpression(symbols);

        accumulateBinaryExpression('or');
    }
}

const logicExpressionLevel2 = (symbols) => {
    comparisonExpression(symbols);

    if (tryConsume('and')(symbols)) {
        comparisonExpression(symbols);

        accumulateBinaryExpression('and');
    }
}

const comparisonExpression = (symbols) => {
    comparisonExpressionLevel2(symbols);

    for (let operator of ['equal', 'different']) {
        if (tryConsume(operator)(symbols)) {
            comparisonExpression(symbols);

            accumulateBinaryExpression(operator);

            break;
        }
    }
}

const comparisonExpressionLevel2 = (symbols) => {
    numericExpression(symbols);

    for (let operator of ['greater', 'greater or equal', 'less', 'less or equal']) {
        if (tryConsume(operator)(symbols)) {
            comparisonExpression(symbols);

            accumulateBinaryExpression(operator);

            break;
        }
    }
}

const numericExpression = (symbols) => {
    numericExpressionLevel2(symbols);

    let consumed = false;

    do {
        consumed = false;

        for (let operator of ['plus', 'minus']) {
            if (tryConsume(operator)(symbols)) {
                numericExpression(symbols);

                accumulateBinaryExpression(operator);

                consumed = true;
            }
        }
    } while (consumed);
}

const numericExpressionLevel2 = (symbols) => {
    numericExpressionLevel3(symbols);

    let consumed = false;

    do {
        consumed = false;

        for (let operator of ['asterisk', 'slash']) {
            if (tryConsume(operator)(symbols)) {
                numericExpression(symbols);

                accumulateBinaryExpression(operator);

                consumed = true;
            }
        }
    } while (consumed);
}

const numericExpressionLevel3 = (symbols) => {
    if (tryConsume('left parenthesis')(symbols)) {
        numericExpression(symbols);

        consume('right parenthesis')(symbols);
    } else {
        const symbol = symbols[0];

        consume('number')(symbols);

        semanticStack.push({
            construction: 'literal',
            value: parseFloat(symbol.lexeme)
        });
    }
}

const generateAST = (symbols) => {
    logicExpression(symbols);

    return semanticStack.pop();
}

const check = ast => {
    if (ast.construction === 'literal') {
        return {
            ok: true,
            type: 'numeric'
        };
    }

    if (ast.construction !== 'expression') {
        throw 'Construction? ' + ast.construction;
    }

    const left = check(ast.left);
    const right = check(ast.right);

    if (left.error || right.error) {
        return left.error || right.error;
    }

    const numericOperators = ['plus', 'minus', 'asterisk', 'slash'];

    if (numericOperators.indexOf(ast.operator) !== -1) {
        if (left.type !== 'numeric') {
            return {
                error: true,
                symbol: ast.left,
                message: 'Should be numeric type'
            }
        }

        if (right.type !== 'numeric') {
            return {
                error: true,
                symbol: ast.right,
                message: 'Should be numeric type'
            }
        }

        return {
            ok: true,
            type: 'numeric'
        }
    }

    const comparisonOperators = ['equal', 'different', 'greater', 'greater or equal', 'less', 'less or equal'];

    if (comparisonOperators.indexOf(ast.operator) !== -1) {
        if (left.type !== 'numeric') {
            return {
                error: true,
                symbol: ast.left,
                message: 'Should be numeric type'
            }
        }

        if (right.type !== 'numeric') {
            return {
                error: true,
                symbol: ast.right,
                message: 'Should be numeric type'
            }
        }

        return {
            ok: true,
            type: 'boolean'
        }
    }

    const logicOperators = ['and', 'or'];

    if (logicOperators.indexOf(ast.operator) !== -1) {
        if (left.type !== 'boolean') {
            return {
                error: true,
                symbol: ast.left,
                message: 'Should be boolean type'
            }
        }

        if (right.type !== 'boolean') {
            return {
                error: true,
                symbol: ast.right,
                message: 'Should be boolean type'
            }
        }

        return {
            ok: true,
            type: 'boolean'
        }
    }

    throw 'Operator? ' + ast.operator;
}
