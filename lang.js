const tokens = [
    {
        name: 'semicolon',
        pattern: /^;/
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
    },
    {
        name: 'bool literal',
        pattern: /^((true)|(false))\b/
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
        name: 'identifier literal',
        pattern: /^[a-zA-Z_]\w*/
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

    throw `Unexpected token "${s.token.name}" at position ${s.position}: ${s.lexeme}. Expecting ${tokenName}`;
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

const lookAhead = symbols => tokenName => {
    return symbols.length > 0 && symbols[0].token.name === tokenName;
}

const statement = symbols => {
    const firstTokenStatements = {
        'while keyword': whileStatement,
        'if keyword': ifStatement,
        'number keyword': variableDeclaration,
        'bool keyword': variableDeclaration,
        'identifier literal': assignment
    };

    const nextStatement = Object.keys(firstTokenStatements).find(lookAhead(symbols));

    if (nextStatement) {
        firstTokenStatements[nextStatement](symbols);

        return true;
    }

    return false;
}

const ifStatement = symbols => {
    consume('if keyword')(symbols);

    logicExpression(symbols);

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

    logicExpression(symbols);

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
    let declarationKeyword = '';

    if (tryConsume('number keyword')(symbols)) {
        declarationKeyword = 'number'
    } else if (tryConsume('bool keyword')(symbols)) {
        declarationKeyword = 'bool'
    }

    const symbolIdentifier = symbols[0];

    consume('identifier literal')(symbols);

    consume("assignment")(symbols);

    logicExpression(symbols);

    consume('semicolon')(symbols);

    const expr = semanticStack.pop();

    semanticStack.push({
        construction: 'variable declaration',
        declarationKeyword: declarationKeyword,
        identifier: symbolIdentifier.lexeme,
        expression: expr
    });
}

const assignment = symbols => {
    const symbolIdentifier = symbols[0];

    consume('identifier literal')(symbols);

    consume('assignment')(symbols);

    logicExpression(symbols);

    consume('semicolon')(symbols);

    const expr = semanticStack.pop();

    semanticStack.push({
        construction: 'assignment',
        identifier: symbolIdentifier.lexeme,
        expression: expr
    });
}

const logicExpression = symbols => {
    logicExpressionLevel2(symbols);

    if (tryConsume('or')(symbols)) {
        logicExpressionLevel2(symbols);

        accumulateBinaryExpression('or');
    }
}

const logicExpressionLevel2 = symbols => {
    comparisonExpression(symbols);

    if (tryConsume('and')(symbols)) {
        comparisonExpression(symbols);

        accumulateBinaryExpression('and');
    }
}

const comparisonExpression = symbols => {
    comparisonExpressionLevel2(symbols);

    for (let operator of ['equal', 'different']) {
        if (tryConsume(operator)(symbols)) {
            comparisonExpressionLevel2(symbols);

            accumulateBinaryExpression(operator);

            break;
        }
    }
}

const comparisonExpressionLevel2 = symbols => {
    numericExpression(symbols);

    for (let operator of ['greater', 'greater or equal', 'less', 'less or equal']) {
        if (tryConsume(operator)(symbols)) {
            numericExpression(symbols);

            accumulateBinaryExpression(operator);

            break;
        }
    }
}

const numericExpression = symbols => {
    numericExpressionLevel2(symbols);

    let consumed = false;

    do {
        consumed = false;

        for (let operator of ['plus', 'minus']) {
            if (tryConsume(operator)(symbols)) {
                numericExpressionLevel2(symbols);

                accumulateBinaryExpression(operator);

                consumed = true;

                break;
            }
        }
    } while (consumed);
}

const numericExpressionLevel2 = symbols => {
    numericExpressionLevel3(symbols);

    let consumed = false;

    do {
        consumed = false;

        for (let operator of ['asterisk', 'slash']) {
            if (tryConsume(operator)(symbols)) {
                numericExpressionLevel3(symbols);

                accumulateBinaryExpression(operator);

                consumed = true;

                break;
            }
        }
    } while (consumed);
}

const numericExpressionLevel3 = symbols => {
    const isNegative = tryConsume('minus')(symbols);

    if (tryConsume('left parenthesis')(symbols)) {
        comparisonExpression(symbols);

        consume('right parenthesis')(symbols);
    } else {
        const symbol = symbols[0];

        if (tryConsume('number literal')(symbols)) {
            semanticStack.push({
                construction: 'literal',
                value: symbol.lexeme,
                tokenName: 'number literal'
            });
        } else if (tryConsume('bool literal')(symbols)) {
            semanticStack.push({
                construction: 'literal',
                value: symbol.lexeme,
                tokenName: 'bool literal'
            });
        } else if (tryConsume('identifier literal')(symbols)) {
            semanticStack.push({
                construction: 'literal',
                value: symbol.lexeme,
                tokenName: 'identifier literal'
            });
        } else {
            throw 'Invalid token, expecting literal or left parenthesis: ' + symbol[0];
        }
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

const analyzeLiteral = ast => {
    let response = {
        ok: true
    };

    switch (ast.tokenName) {
        case 'number literal':
            response.type = 'numeric'
            break;
        case 'bool literal':
            response.type = 'boolean'
            break;
        case 'identifier literal':
            if (!variableTable[ast.value]) {
                return {
                    ok: false,
                    message: `Identifier ${ast.value} not declared`
                };
            }

            response.type = variableTable[ast.value];
            break;
        default:
            throw 'Bad token name: ' + ast.tokenName;
    }

    return response;
}

const analyzeBinaryExpression = ast => {
    const left = analyze(ast.left);
    const right = analyze(ast.right);

    if (!left.ok || !right.ok) {
        return left.ok ? right : left;
    }

    const checkTypes = operandType => returnType => {
        if (left.type !== operandType) {
            return {
                ok: false,
                symbol: ast.left,
                message: `Should be ${operandType} type`
            }
        }

        if (right.type !== operandType) {
            return {
                ok: false,
                symbol: ast.right,
                message: `Should be ${operandType} type`
            }
        }

        return {
            ok: true,
            type: returnType
        };
    }

    switch (ast.operator) {
        case 'plus':
        case 'minus':
        case 'asterisk':
        case 'slash':
            return checkTypes('numeric')('numeric');
        case 'equal':
        case 'different':
        case 'greater':
        case 'greater or equal':
        case 'less':
        case 'less or equal':
            return checkTypes('numeric')('boolean');
        case 'and':
        case 'or':
            return checkTypes('boolean')('boolean');
    }

    throw 'Bad operator: ' + ast.operator;
}

const analyzeUnaryExpression = ast => {
    const analyzedExpr = analyze(ast.expression);

    if (!analyzedExpr.ok) {
        return analyzedExpr;
    }

    if (analyzedExpr.type !== 'numeric') {
        return {
            ok: false,
            symbol: ast.expression,
            message: `Should be numeric type`
        }
    }

    return {
        ok: true,
        type: 'numeric'
    };
}

const analyzeVariableDeclaration = ast => {
    if (variableTable[ast.identifier]) {
        return {
            ok: false,
            message: 'Variable already declared: ' + ast.identifier
        };
    }

    const exprAnalyzed = analyze(ast.expression);

    if (!exprAnalyzed.ok) {
        return exprAnalyzed;
    }

    let declarationType = '';

    switch (ast.declarationKeyword) {
        case 'number':
            declarationType = 'numeric';
            break;
        case 'bool':
            declarationType = 'boolean';
            break;
        default:
            throw 'Bad declaration keyword:' + ast.declarationKeyword;
    }
    if (declarationType !== exprAnalyzed.type) {
        return {
            ok: false,
            message: `Should be ${declarationType} type`
        };
    }

    variableTable[ast.identifier] = declarationType;

    return {
        ok: true,
        type: 'none'
    };
}

const analyzeWhileStatement = ast => {
    const conditionAnalyzed = analyze(ast.condition);

    if (!conditionAnalyzed.ok) {
        return conditionAnalyzed;
    }

    if (conditionAnalyzed.type !== 'boolean') {
        return {
            ok: false,
            symbol: ast.condition,
            message: `Should be boolean type`
        };
    }

    for (let member of ast.body) {
        const memberAnalyzed = analyze(member);

        if (!memberAnalyzed.ok) {
            return memberAnalyzed;
        }
    }

    return {
        ok: true,
        type: 'none'
    };
}

const analyzeIfStatement = ast => {
    const conditionAnalyzed = analyze(ast.condition);

    if (!conditionAnalyzed.ok) {
        return conditionAnalyzed;
    }

    if (conditionAnalyzed.type !== 'boolean') {
        return {
            ok: false,
            message: 'Should be boolean type'
        };
    }

    for (let member of ast.ifBody.concat(ast.elseBody)) {
        const memberAnalyzed = analyze(member);

        if (!memberAnalyzed.ok) {
            return memberAnalyzed;
        }
    }

    return {
        ok: true,
        type: 'none'
    }
}

const analyzeAssignment = ast => {
    if (!variableTable[ast.identifier]) {
        return {
            ok: false,
            message: `Identifier ${ast.identifier} not declared`
        };
    }

    const exprAnalyzed = analyze(ast.expression);

    if (!exprAnalyzed.ok) {
        return exprAnalyzed;
    }

    if (variableTable[ast.identifier] !== exprAnalyzed.type) {
        return {
            ok: false,
            message: `Cannot assign ${exprAnalyzed.type} to ${variableTable[ast.identifier]} variable`
        };
    }

    return {
        ok: true,
        type: variableTable[ast.identifier]
    };
}

const analyzeProgram = ast => {
    for (let member of ast.body) {
        const memberAnalyzed = analyze(member);

        if (!memberAnalyzed.ok) {
            return memberAnalyzed;
        }
    }

    return {
        ok: true,
        type: 'none'
    };
}

let variableTable = {};

const analyze = ast => {
    switch (ast.construction) {
        case 'literal':
            return analyzeLiteral(ast);
        case 'binary expression':
            return analyzeBinaryExpression(ast);
        case 'unary expression':
            return analyzeUnaryExpression(ast);
        case 'variable declaration':
            return analyzeVariableDeclaration(ast);
        case 'assignment':
            return analyzeAssignment(ast);
        case 'while statement':
            return analyzeWhileStatement(ast);
        case 'if statement':
            return analyzeIfStatement(ast);
        case 'program':
            variableTable = {};
            return analyzeProgram(ast);
        default:
            throw 'Undefined Construction: ' + ast.construction;
    }
}

const generateAST = symbols => {
    const program = {
        construction: 'program',
        body: []
    }

    while (symbols.length > 0) {
        if (!statement(symbols)) {
            throw 'Invalid statement:' + symbols[0].lexeme;
        }

        program.body.push(semanticStack.pop());
    }

    return program;
}
