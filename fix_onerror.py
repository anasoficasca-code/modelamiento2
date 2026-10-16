import io

with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove the broken error handlers
import re
html = re.sub(r'<script>.*?window\.onerror.*?</script>', '', html, flags=re.DOTALL)

# Inject a simple alert error handler
alert_script = '''<script>
window.onerror = function(msg, url, line) { alert("JS Error: " + msg + " at line " + line); };
window.addEventListener("unhandledrejection", function(e) { alert("Promise Error: " + (e.reason ? e.reason.message || e.reason : "unknown")); });
</script>'''

html = html.replace('<head>', '<head>\n' + alert_script)

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)
