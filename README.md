# Mythology

A small, simple and strong programming language.

### Grammar

    program :=
        statement-list

    statement :=
        while
        if
        variable-declaration
        assignment

    while :=
        'while' logic-expression 'do' statement-list 'end'

    if :=
        'if' logic-expression 'do' statement-list 'end'
        'if' logic-expression 'do' statement-list 'else' statement-list 'end'

    variable-declaration :=
        type identifier '=' logic-expression

    assignment :=
        identifier '=' logic-expression

    logic-expression :=
        logic-expression-2
        logic-expression-2 'or' logic-expression-2

    logic-expression-2 :=
        comparison-expression
        comparison-expression 'and' comparison-expression

    comparison-expression :=
        comparison-expression-2
        comparison-expression-2 '==' comparison-expression-2
        comparison-expression-2 '!=' comparison-expression-2

    comparison-expression-2 :=
        numeric-expression
        numeric-expression '>'  numeric-expression
        numeric-expression '>=' numeric-expression
        numeric-expression '<'  numeric-expression
        numeric-expression '<=' numeric-expression

    numeric-expression :=
        numeric-expression-2
        numeric-expression-2 '+' numeric-expression-2
        numeric-expression-2 '-' numeric-expression-2

    numeric-expression-2 :=
        numeric-expression-3
        numeric-expression-3 '*' numeric-expression-3
        numeric-expression-3 '/' numeric-expression-3

    numeric-expression-4
        '-' '(' logic-expression ')'
        '-' number-literal
        '(' logic-expression ')'
        number-literal
        bool-literal
        text-literal

    type :=
        'number'
        'bool'
        'text'

    identifier :=
        [a-zA-Z_][\w_]*

    bool-literal :=
        'true'
        'false'

    number-literal :=
        \d+(\.\d+)?

    text-literal :=
        "[^"]*"


[Try it online](https://ihavenonickname.github.io/Mythology/)

-------------------------

This project is in very early stages
