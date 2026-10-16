import urllib.request
import json
import time
import os
import http.server
import socketserver
import threading
import subprocess

html = """<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<canvas id="sceneCanvas"></canvas>
<script>
  window.errors = [];
  window.onerror = function(msg, url, line, col, error) {
    window.errors.push(msg + ' at line ' + line + ':' + col);
  };
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="modulo-10-corte.js"></script>
<script>
  setTimeout(() => {
    fetch('http://localhost:9999/log', {
        method: 'POST',
        body: JSON.stringify(window.errors)
    }).catch(e => {});
  }, 1000);
</script>
</body>
</html>"""

with open("test_error.html", "w", encoding="utf-8") as f:
    f.write(html)

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/log':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            print('BROWSER ERRORS:', post_data.decode('utf-8'))
            self.send_response(200)
            self.end_headers()
            os._exit(0)
        else:
            self.send_response(404)
            self.end_headers()

def run_server():
    with socketserver.TCPServer(('', 9999), Handler) as httpd:
        httpd.serve_forever()

t = threading.Thread(target=run_server)
t.daemon = True
t.start()

print("Server started. Launching edge...")
subprocess.Popen(['powershell', '-Command', 'Start-Process msedge "http://localhost:9999/test_error.html"'])
time.sleep(5)
