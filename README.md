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
        function-call

    function-call :=
        identifier arguments

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
        expression-4 'is' expression-4
        expression-4 'isnt' expression-4

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

    expression-7 :=
        expression-8
        '-' expression-8
        'not' expression-8

    expression-8
        '(' expression ')'
        number
        bool
        text
        identifier
        function-call

    arguments :=
        '(' expression list separeted by comma ')'

    type :=
        'number'
        'bool'
        'text'

    identifier :=
        [a-zA-Z_][\w_]*

    bool :=
        'true'
        'false'

    number :=
        \d+(\.\d+)?

    text :=
        "[^"]*"


### Getting started

    $ git clone https://github.com/ihavenonickname/Mythology.git
    $ cd Mythology
    $ node mythology <my-script.myth> [--run] [--ast]

-------------------------

This project is in very early stages
