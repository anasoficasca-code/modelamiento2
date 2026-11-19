import io, re

js = io.open('modulo-10-corte.js', 'r', encoding='utf-8').read()

# 1. Raise road Y coordinates
js = js.replace('positions.push(a.x, 0, a.z, b.x, 0, b.z);', 'positions.push(a.x, 0.05, a.z, b.x, 0.05, b.z);')
js = js.replace('const yJitter = 0.03 + ((edgeIdx * 2654435761) % 1000) / 1000 * 0.05;', 'const yJitter = 0.06 + ((edgeIdx * 2654435761) % 1000) / 1000 * 0.05;')

# 2. Re-attach slider listeners (if they exist, replace them or inject them)
listeners = '''
// Restored zoom listeners
const fovSlider = document.getElementById("fovSlider");
if (fovSlider) {
    fovSlider.addEventListener("input", (e) => {
        const v = parseInt(e.target.value);
        if(document.getElementById("valFov")) document.getElementById("valFov").textContent = v;
        if(typeof sectionCamera !== 'undefined' && sectionCamera) {
            sectionCamera.fov = v;
            sectionCamera.updateProjectionMatrix();
        }
    });
}
const scaleSlider = document.getElementById("scaleSlider");
if (scaleSlider) {
    scaleSlider.addEventListener("input", (e) => {
        const v = parseFloat(e.target.value);
        if(document.getElementById("valScale")) document.getElementById("valScale").textContent = v.toFixed(1);
        escalaScale = v;
        applyEscalaTransform();
    });
}
const offXSlider = document.getElementById("offXSlider");
if (offXSlider) {
    offXSlider.addEventListener("input", (e) => {
        const v = parseInt(e.target.value);
        if(document.getElementById("valOffX")) document.getElementById("valOffX").textContent = v;
        escalaOffX = v;
        applyEscalaTransform();
    });
}
const offYSlider = document.getElementById("offYSlider");
if (offYSlider) {
    offYSlider.addEventListener("input", (e) => {
        const v = parseInt(e.target.value);
        if(document.getElementById("valOffY")) document.getElementById("valOffY").textContent = v;
        escalaOffY = v;
        applyEscalaTransform();
    });
}
'''
if 'fovSlider.addEventListener' not in js:
    js += '\n' + listeners

io.open('modulo-10-corte.js', 'w', encoding='utf-8').write(js)
