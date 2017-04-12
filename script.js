const get = id => document.getElementById(id);

get('analyze').onclick = () => {
    const source = get('source').value;

    try {
        const ast = generateAST(symbolize(source));
        const res = check(ast);

        if (res.ok) {
            get('result').innerText = `Well formed expression of ${res.type} type`;
        } else {
            get('result').innerText = 'Malformed expression: ' + res.message;
        }

        get("ast").value = JSON.stringify(ast, null, 2);
    } catch (e) {
        get('result').innerText = e;
        get("ast").value = '';
    }
}
