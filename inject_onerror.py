import io

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

onerror_script = '''<script>
window.onerror = function(msg, url, line, col, error) {
    var errDiv = document.createElement("div");
    errDiv.style.position = "absolute";
    errDiv.style.top = "50px";
    errDiv.style.left = "50px";
    errDiv.style.zIndex = "999999";
    errDiv.style.background = "red";
    errDiv.style.color = "white";
    errDiv.style.padding = "20px";
    errDiv.style.fontSize = "20px";
    errDiv.innerHTML = "ERROR: " + msg + "<br>Line: " + line;
    document.body.appendChild(errDiv);
    return false;
};
window.addEventListener("unhandledrejection", function(e) {
    var errDiv = document.createElement("div");
    errDiv.style.position = "absolute";
    errDiv.style.top = "150px";
    errDiv.style.left = "50px";
    errDiv.style.zIndex = "999999";
    errDiv.style.background = "orange";
    errDiv.style.color = "white";
    errDiv.style.padding = "20px";
    errDiv.style.fontSize = "20px";
    errDiv.innerHTML = "PROMISE REJECTION: " + (e.reason ? e.reason.stack : e.reason);
    document.body.appendChild(errDiv);
});
</script>'''

html = html.replace('<head>', '<head>\n' + onerror_script)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
