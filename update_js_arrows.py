import io

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

# Change defaults
cjs = cjs.replace('let escalaScale = 1, escalaOffX = 0, escalaOffY = 0;', 'let escalaScale = 1.20, escalaOffX = 0, escalaOffY = 0;')

# Replace listeners
target = '''const escalaZoomIn = document.getElementById("escalaZoomIn");
  const escalaZoomOut = document.getElementById("escalaZoomOut");
  const escalaZoomReset = document.getElementById("escalaZoomReset");
  if (escalaZoomIn) escalaZoomIn.addEventListener("click", (e) => { e.stopPropagation(); escalaScale = Math.min(2.5, escalaScale + 0.1); applyEscalaTransform(); });
  if (escalaZoomOut) escalaZoomOut.addEventListener("click", (e) => { e.stopPropagation(); escalaScale = Math.max(0.4, escalaScale - 0.1); applyEscalaTransform(); });
  if (escalaZoomReset) escalaZoomReset.addEventListener("click", (e) => { e.stopPropagation(); escalaScale = 1; escalaOffX = 0; escalaOffY = 0; applyEscalaTransform(); });'''

repl = '''const panUp = document.getElementById("panUp");
  const panDown = document.getElementById("panDown");
  const panLeft = document.getElementById("panLeft");
  const panRight = document.getElementById("panRight");
  const PAN_STEP = 20;
  if (panUp) panUp.addEventListener("click", (e) => { e.stopPropagation(); escalaOffY -= PAN_STEP; applyEscalaTransform(); });
  if (panDown) panDown.addEventListener("click", (e) => { e.stopPropagation(); escalaOffY += PAN_STEP; applyEscalaTransform(); });
  if (panLeft) panLeft.addEventListener("click", (e) => { e.stopPropagation(); escalaOffX -= PAN_STEP; applyEscalaTransform(); });
  if (panRight) panRight.addEventListener("click", (e) => { e.stopPropagation(); escalaOffX += PAN_STEP; applyEscalaTransform(); });'''

cjs = cjs.replace(target, repl)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)

