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
        'while' expression 'do' statement-list 'end'

    if :=
        'if' expression 'do' statement-list 'end'
        'if' expression 'do' statement-list 'else' statement-list 'end'

    variable-declaration :=
        type identifier '=' expression

    assignment :=
        identifier '=' expression

    expression :=
        expression-2
        expression-2 'or' expression-2

    expression-2 :=
        expression-3
        expression-3 'and' expression-3

    expression-3 :=
        expression-4
        expression-4 '==' expression-4
        expression-4 '!=' expression-4

    expression-4 :=
        expression-5
        expression-5 '>'  expression-5
        expression-5 '>=' expression-5
        expression-5 '<'  expression-5
        expression-5 '<=' expression-5

    expression-5 :=
        expression-6
        expression-6 '+' expression-6
        expression-6 '-' expression-6

    expression-6 :=
        expression-7
        expression-7 '*' expression-7
        expression-7 '/' expression-7

    expression-7
        '-' '(' expression ')'
        '-' number-literal
        '-' identifier arguments
        '(' expression ')'
        number-literal
        bool-literal
        text-literal
        identifier
        identifier arguments

    arguments :=
        '(' expression list separeted by comma ')'

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
