const analyzeLiteral = ast => {
    return {
        ok: true,
        type: ast.type
    };
}

const analyzeIdentifier = ast => {
    if (!environment.variables[ast.name]) {
        return {
            ok: false,
            message: `Variable '${ast.name}' not declared`
        };
    }

    return {
        ok: true,
        type: environment.variables[ast.name]
    };
}

const analyzeBinaryOperation = ast => {
    const left = analyze(ast.left);
    const right = analyze(ast.right);

    if (!left.ok || !right.ok) {
        return left.ok ? right : left;
    }

    if (ast.operation === 'sum' && left.type === 'text') {
        if (right.type !== 'text') {
            return {
                ok: false,
                symbol: ast.left,
                message: `Right-hand side of sum should be text`
            }
        }

        return {
            ok: true,
            type: 'text'
        };
    }

    const checkTypes = operandType => returnType => {
        if (left.type !== operandType) {
            return {
                ok: false,
                symbol: ast.left,
                message: `Left-hand side of ${ast.operation} should be ${operandType}`
            }
        }

        if (right.type !== operandType) {
            return {
                ok: false,
                symbol: ast.right,
                message: `Right-hand side of ${ast.operation} should be ${operandType}`
            }
        }

        return {
            ok: true,
            type: returnType
        };
    }

    switch (ast.operation) {
        case 'sum':
        case 'subtraction':
        case 'multiplication':
        case 'division':
            return checkTypes('number')('number');
        case 'equality':
        case 'inequality':
        case 'greater':
        case 'greater or equal':
        case 'less':
        case 'less or equal':
            return checkTypes('number')('bool');
        case 'conjuction':
        case 'disjunction':
            return checkTypes('bool')('bool');
        default:
            throw 'Bad binary operation: ' + ast.operation;
    }
}

const analyzeUnaryOperation = ast => {
    const analyzedExpr = analyze(ast.expression);

    if (!analyzedExpr.ok) {
        return analyzedExpr;
    }

    if (ast.operation === 'negative') {
        if (analyzedExpr.type === 'number') {
            return {
                ok: true,
                type: 'number'
            };
        }

        return {
            ok: false,
            symbol: ast.expression,
            message: `Only number expression can be negative`
        };
    }

    if (ast.operation === 'negation') {
        if (analyzedExpr.type === 'bool') {
            return {
                ok: true,
                type: 'bool'
            };
        }

        return {
            ok: false,
            symbol: ast.expression,
            message: `Only bool expression can be negated`
        };
    }

    throw 'Bad unary operation: ' + ast.operation;
}

const analyzeVariableDeclaration = ast => {
    if (environment.variables[ast.identifier]) {
        return {
            ok: false,
            message: `Identifier '${ast.identifier}' already declared`
        };
    }

    const exprAnalyzed = analyze(ast.expression);

    if (!exprAnalyzed.ok) {
        return exprAnalyzed;
    }

    if (ast.type !== exprAnalyzed.type) {
        return {
            ok: false,
            message: `Identifier '${ast.identifier}' declared as ${ast.type} but ${exprAnalyzed.type} expression given`
        };
    }

    environment.variables[ast.identifier] = ast.type;

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

    if (conditionAnalyzed.type !== 'bool') {
        return {
            ok: false,
            symbol: ast.condition,
            message: 'Only bool expressions in WHILE statement'
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

    if (conditionAnalyzed.type !== 'bool') {
        return {
            ok: false,
            message: 'Only bool expressions in IF statement'
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
    const typeInfo = environment.variables[ast.identifier];

    if (!typeInfo) {
        return {
            ok: false,
            message: `Identifier '${ast.identifier}' not declared`
        };
    }

    const exprAnalyzed = analyze(ast.expression);

    if (!exprAnalyzed.ok) {
        return exprAnalyzed;
    }

    if (typeInfo !== exprAnalyzed.type) {
        return {
            ok: false,
            message: `'${ast.identifier}' is ${typeInfo} and cannot be assign as ${exprAnalyzed.type}`
        };
    }

    return {
        ok: true,
        type: 'none'
    };
}

const analyzeFunctionCall = ast => {
    const typeInfo = environment.functions[ast.identifier];

    if (!typeInfo) {
        return {
            ok: false,
            message: `Function '${ast.identifier}' not declared`
        };
    }

    if (ast.args.length !== typeInfo.argsTypes.length) {
        return {
            ok: false,
            message: `Function '${ast.identifier}' expects ${typeInfo.argsTypes.length} arguments, but ${ast.args.length} given`
        };
    }

    for (let i = 0; i < ast.args.length; i++) {
        const argAnalyzed = analyze(ast.args[i]);

        if (!argAnalyzed.ok) {
            return argAnalyzed;
        }

        if (argAnalyzed.type !== typeInfo.argsTypes[i]) {
            return {
                ok: false,
                message: `Argument #${i + 1} of function '${ast.identifier}' should be ${typeInfo.argsTypes[i]}, but ${argAnalyzed.type} given`
            };
        }
    }

    return {
        ok: true,
        type: ast.context === 'expression' ? typeInfo.returnType : 'none'
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

let environment = {
    variables: {},
    functions: {}
};

const defaultFunctions = {
    number_to_bool: {
        argsTypes: ['number'],
        returnType: 'bool'
    },
    number_to_text: {
        argsTypes: ['number'],
        returnType: 'text'
    },
    bool_to_number: {
        argsTypes: ['bool'],
        returnType: 'number'
    },
    bool_to_text: {
        argsTypes: ['bool'],
        returnType: 'text'
    },
    text_to_number: {
        argsTypes: ['text'],
        returnType: 'number'
    },
    text_to_bool: {
        argsTypes: ['text'],
        returnType: 'bool'
    },
    modulo: {
        argsTypes: ['number', 'number'],
        returnType: 'number'
    },
    input: {
        argsTypes: [],
        returnType: 'text'
    },
    print: {
        argsTypes: ['text'],
        returnType: 'none'
    }
};

const analyze = ast => {
    switch (ast.construction) {
        case 'literal':
            return analyzeLiteral(ast);
        case 'identifier':
            return analyzeIdentifier(ast);
        case 'function call':
            return analyzeFunctionCall(ast);
        case 'binary operation':
            return analyzeBinaryOperation(ast);
        case 'unary operation':
            return analyzeUnaryOperation(ast);
        case 'variable declaration':
            return analyzeVariableDeclaration(ast);
        case 'assignment':
            return analyzeAssignment(ast);
        case 'while statement':
            return analyzeWhileStatement(ast);
        case 'if statement':
            return analyzeIfStatement(ast);
        case 'program':
            environment = {
                variables: {},
                functions: defaultFunctions
            };

            return analyzeProgram(ast);
        default:
            throw 'Undefined construction: ' + ast.construction;
    }
}

module.exports = analyze;