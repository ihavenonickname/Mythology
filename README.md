# Mythology

A small, simple and type safe programming language.

### Running

    $ git clone https://github.com/ihavenonickname/Mythology.git
    $ cd Mythology
    $ node mythology <path to your myth script> <options>

CLI options are

* `--run` Runs your code
* `--ast` Prints the abstract syntax tree of your code

### Example code

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

---

This project is in very early stage.
