import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = '''  const panLeft = document.getElementById("panLeft");
  const panRight = document.getElementById("panRight");
  const PAN_STEP = 20;'''

replace = '''  const panLeft = document.getElementById("panLeft");
  const panRight = document.getElementById("panRight");
  const PAN_STEP = 20;
  
  const escalaZoomSlider = document.getElementById("escalaZoomSlider");
  if (escalaZoomSlider) {
    escalaZoomSlider.addEventListener("input", (e) => {
      escalaScale = parseFloat(e.target.value) / 100;
      applyEscalaTransform();
    });
  }'''

js = js.replace(target, replace)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(js)
