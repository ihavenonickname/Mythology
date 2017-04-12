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
        construction: 'binary expression',
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

                break;
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

                break;
            }
        }
    } while (consumed);
}

const numericExpressionLevel3 = (symbols) => {
    const isNegative = tryConsume('minus')(symbols);

    if (tryConsume('left parenthesis')(symbols)) {
        comparisonExpression(symbols);

        consume('right parenthesis')(symbols);
    } else {
        const symbol = symbols[0];

        consume('number')(symbols);

        semanticStack.push({
            construction: 'literal',
            value: parseFloat(symbol.lexeme)
        });
    }

    if (isNegative) {
        const expr = semanticStack.pop();

        semanticStack.push({
            construction: 'unary expression',
            operator: 'minus',
            expression: expr
        });
    }
}

const generateAST = (symbols) => {
    logicExpression(symbols);

    return semanticStack.pop();
}

const analyzeLiteral = ast => {
    return {
        ok: true,
        type: 'numeric'
    };
}

const analyzeBinaryExpression = ast => {
    const left = analyze(ast.left);
    const right = analyze(ast.right);

    if (left.error || right.error) {
        return left.error ? left : right;
    }

    const checkTypes = operandType => returnType => {
        if (left.type !== operandType) {
            return {
                error: true,
                symbol: ast.left,
                message: `Should be ${operandType} type`
            }
        }

        if (right.type !== operandType) {
            return {
                error: true,
                symbol: ast.right,
                message: `Should be ${operandType} type`
            }
        }

        return {
            ok: true,
            type: returnType
        };
    }

    const numericOperators = ['plus', 'minus', 'asterisk', 'slash'];

    if (numericOperators.indexOf(ast.operator) !== -1) {
        return checkTypes('numeric')('numeric');
    }

    const comparisonOperators = ['equal', 'different', 'greater', 'greater or equal', 'less', 'less or equal'];

    if (comparisonOperators.indexOf(ast.operator) !== -1) {
        return checkTypes('numeric')('boolean');
    }

    const logicOperators = ['and', 'or'];

    if (logicOperators.indexOf(ast.operator) !== -1) {
        return checkTypes('boolean')('boolean');
    }

    throw 'Bad operator: ' + ast.operator;
}

const analyzeUnaryExpression = ast => {
    const analyzedExpr = analyze(ast.expression);

    if (analyzedExpr.error) {
        return analyzedExpr;
    }

    if (analyzedExpr.type !== 'numeric') {
        return {
            error: true,
            symbol: ast.expression,
            message: `Should be numeric type`
        }
    }

    return {
        ok: true,
        type: 'numeric'
    };
}

const analyze = ast => {
    switch (ast.construction) {
    case 'literal':
        return analyzeLiteral(ast);
    case 'binary expression':
        return analyzeBinaryExpression(ast);
    case 'unary expression':
        return analyzeUnaryExpression(ast);
    default:
        throw 'Undefined Construction: ' + ast.construction;
    }
}
