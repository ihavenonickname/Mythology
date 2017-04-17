const get = id => document.getElementById(id);

get('analyze').onclick = () => {
    const source = get('source').value;

    try {
        const symbols = symbolize(source);
        const ast = generateAST(symbols);
        const analyzis = analyze(ast);

        if (analyzis.ok) {
            get('result').innerText = '';
            get("ast").value = JSON.stringify(ast, null, 4);
        } else {
            get("ast").value = '';
            get('result').innerHTML = 'Malformed expression <p>' + analyzis.message + '</p>';
        }
    } catch (e) {
        get('result').innerHTML = '<strong>Exception while parsing</strong><p>' + e + '</p>';
        get("ast").value = '';
    }
}
