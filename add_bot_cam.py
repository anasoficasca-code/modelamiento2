import io, re

with io.open('modulo-10-corte.js', 'r', encoding='utf-8') as f:
    cjs = f.read()

target_output = '''botBoxOutput.value =
        `Rotación: ${rot}°\\n` +
        `U (a lo largo del giro): ${botXMin.value}% a ${botXMax.value}%\\n` +
        `Y (altura, m): ${(yMin / SCALE).toFixed(1)} a ${(yMax / SCALE).toFixed(1)}\\n` +
        `V (perpendicular): ${botZMin.value}% a ${botZMax.value}%\\n` +
        `(referencia sin girar — real ${Math.round(Math.min(r0[0], r1[0]))} a ${Math.round(Math.max(r0[0], r1[0]))} / ${Math.round(Math.min(r0[1], r1[1]))} a ${Math.round(Math.max(r0[1], r1[1]))})`;'''

repl_output = '''let camStr = "";
      if (sectionCamera && sectionControls) {
        camStr = `\\n--- Cámara Inferior ---\\n` +
                 `Posición: ${sectionCamera.position.x.toFixed(1)}, ${sectionCamera.position.y.toFixed(1)}, ${sectionCamera.position.z.toFixed(1)}\\n` +
                 `Mira hacia: ${sectionControls.target.x.toFixed(1)}, ${sectionControls.target.y.toFixed(1)}, ${sectionControls.target.z.toFixed(1)}\\n` +
                 `Zoom: ${sectionCamera.zoom.toFixed(2)}`;
      }
      botBoxOutput.value =
        `Rotación: ${rot}°\\n` +
        `U (a lo largo del giro): ${botXMin.value}% a ${botXMax.value}%\\n` +
        `Y (altura, m): ${(yMin / SCALE).toFixed(1)} a ${(yMax / SCALE).toFixed(1)}\\n` +
        `V (perpendicular): ${botZMin.value}% a ${botZMax.value}%\\n` +
        `(referencia sin girar — real ${Math.round(Math.min(r0[0], r1[0]))} a ${Math.round(Math.max(r0[0], r1[0]))} / ${Math.round(Math.min(r0[1], r1[1]))} a ${Math.round(Math.max(r0[1], r1[1]))})` + camStr;'''
cjs = cjs.replace(target_output, repl_output)

target_hook = '''sectionCamera.lookAt(177.0, 5.5, -25.6);
      if (sectionControls) sectionControls.target.set(177.0, 5.5, -25.6);'''
repl_hook = '''sectionCamera.lookAt(177.0, 5.5, -25.6);
      if (sectionControls) {
        sectionControls.target.set(177.0, 5.5, -25.6);
        sectionControls.addEventListener("change", updateBotBox);
      }'''
cjs = cjs.replace(target_hook, repl_hook)

# Make the textarea taller so it fits the camera output
with io.open('modulo-10-corte.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('textarea id="botBoxOutput" rows="4"', 'textarea id="botBoxOutput" rows="9"')

with io.open('modulo-10-corte.html', 'w', encoding='utf-8') as f:
    f.write(html)

with io.open('modulo-10-corte.js', 'w', encoding='utf-8') as f:
    f.write(cjs)
