# Mythology

A small, simple and type safe programming language

### Getting started

    $ git clone https://github.com/ihavenonickname/Mythology.git
    $ cd Mythology
    $ echo print("Hello world from Mythology"); > script.myth
    $ node mythology script.myth --run

CLI options are

* `--run` Runs your code
* `--ast` Prints the AST of your code

### Getting started

    function do_stuff (text str) text do
        number count = 8;

        while count > 0 do
            print(str);

            count = count - 1;
        end

        draw_matrix(10);

        return "Works like a charm";
    end

    # We got a comment
    function draw_matrix (number size) do
        number n_row = 0;

        while n_row < size do
            number n_col = 0;
            text line = "";

            while n_col < size do
                if modulo(n_col + n_row, 2) is 0 do
                    line = line + "X ";
                else
                    line = line + "O ";
                end

                n_col = n_col + 1;
            end

            print(line); # Yep, a comment

            n_row = n_row + 1;
        end
    end

    function main () do
        print(do_stuff("Hello world from Mythology"));
    end

### Grammar

    program :=
        statement-list

    statement :=
        while
        if
        variable-declaration ';'
        assignment ';'
        function-call ';'

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

-------------------------

This project is in very early stages
