import io, re

with io.open('red-residuos-organicos.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update legend
legend_old = r'<div class="cld-legend">.*?</div>'
legend_new = '''<div class="cld-legend">
  <b>Convenciones de la Red</b><br>
  <span style="color:#3b82f6; font-weight:800; font-size:14px;">\u25a0</span> Causas &nbsp;
  <span style="color:#64748b; font-weight:800; font-size:14px;">\u25a0</span> Caracter\u00edsticas &nbsp;
  <span style="color:#ef4444; font-weight:800; font-size:14px;">\u25a0</span> Efectos<br>
  <div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(0,0,0,.1);">
  <b>+</b> directamente proporcional &nbsp; <b>-</b> inversamente proporcional<br>
  <b> R</b> Bucle reforzador (se retroalimenta)
  </div>
</div>'''
html = re.sub(legend_old, legend_new, html, flags=re.DOTALL)


# 2. Update MACRO array so "corto" has the full text
macro_old = r'const MACRO = \[.*?\];'
macro_new = '''const MACRO = [
  { id:"c1", corto:"C1: Sobrecarga de masa alimentaria", full:"C1: Sobrecarga de masa alimentaria", color:"#3b82f6" },
  { id:"k1", corto:"K1: Volumen de alimentos (5,4 a 5,7M ton/a\u00f1o)", full:"K1: Volumen de alimentos (5,4 a 5,7M ton/a\u00f1o)", color:"#64748b" },
  { id:"k1_2", corto:"K1.2: Entrada de 3,86M veh\u00edculos/a\u00f1o", full:"K1.2: Entrada de 3,86M de veh\u00edculos de carga/a\u00f1o", color:"#64748b" },
  { id:"c2", corto:"C2: Arribo nocturno desacoplado", full:"C2: Arribo nocturno desacoplado", color:"#3b82f6" },
  { id:"s1", corto:"S1: Represamiento de 1.500 camiones", full:"S1: Represamiento de 1.500 camiones en v\u00eda", color:"#ef4444" },
  { id:"k12", corto:"K12: Ausencia de puertos secos", full:"K12: Ausencia de puertos secos perif\u00e9ricos", color:"#64748b" },
  { id:"s2", corto:"S2: Ocupaci\u00f3n andenes con pucheros", full:"S2: Ocupaci\u00f3n no autorizada de andenes con pucheros", color:"#ef4444" },
  { id:"s3", corto:"S3: Peat\u00f3n en calzada vehicular", full:"S3: Desplazamiento del peat\u00f3n a la calzada vehicular", color:"#ef4444" },
  { id:"k6", corto:"K6: Portones a 90\u00b0", full:"K6: Portones a 90\u00b0", color:"#64748b" },
  { id:"s10", corto:"S10: Colapso SITP/TransMilenio", full:"S10: Colapso del transporte p\u00fablico SITP/TransMilenio", color:"#ef4444" },
  { id:"s4", corto:"S4: Acumulaci\u00f3n de >40.000 t/a\u00f1o residuos", full:"S4: Acumulaci\u00f3n de m\u00e1s de 40.000 t/a\u00f1o de residuos", color:"#ef4444" },
  { id:"s9", corto:"S9: Compactaci\u00f3n del suelo de ronda", full:"S9: Compactaci\u00f3n del suelo de ronda", color:"#ef4444" },
  { id:"s5", corto:"S5: Escorrent\u00eda pluvial de aceites", full:"S5: Escorrent\u00eda pluvial de aceites y lixiviados", color:"#ef4444" },
  { id:"c5", corto:"C5: Conexiones erradas (densificaci\u00f3n)", full:"C5: Conexiones erradas por densificaci\u00f3n", color:"#3b82f6" },
  { id:"s6", corto:"S6: Elevaci\u00f3n Carga DBO5/DQO", full:"S6: Elevaci\u00f3n de Carga DBO5/DQO", color:"#ef4444" },
  { id:"s7", corto:"S7: Eutrofizaci\u00f3n y buch\u00f3n", full:"S7: Eutrofizaci\u00f3n y multiplicaci\u00f3n de buch\u00f3n", color:"#ef4444" },
  { id:"s_ox", corto:"S_ox: Ca\u00edda de Ox\u00edgeno Disuelto (Anoxia)", full:"S_ox: Ca\u00edda del Ox\u00edgeno Disuelto y anoxia", color:"#ef4444" },
  { id:"c7", corto:"C7: Invasi\u00f3n de ronda", full:"C7: Invasi\u00f3n de ronda", color:"#3b82f6" }
];'''
html = re.sub(macro_old, macro_new, html, flags=re.DOTALL)


# 3. Make lines white
arrow_old = r'const arrowColorRaw = level === "full" \? "#ffffff" : \(r\.inter \? "#24c8bd" : \(colorFrom\.startsWith\("#"\) \? colorFrom : "#e8ecf1"\)\);'
arrow_new = 'const arrowColorRaw = "#ffffff";'
html = re.sub(arrow_old, arrow_new, html)


# 4. Replace SAVED_MACRO_POSITIONS (with radius scaled by degree)
saved_old = r'const SAVED_MACRO_POSITIONS = \{.*?\};'
saved_new = '''const SAVED_MACRO_POSITIONS = {
  "c1": { x: 340.0, y: 300.0, r: 76.0, t: "C1" },
  "k1": { x: 571.2, y: 138.2, r: 84.0, t: "K1" },
  "k1_2": { x: 780.0, y: 300.0, r: 68.0, t: "K1.2" },
  "c2": { x: 740.0, y: 147.4, r: 60.0, t: "C2" },
  "s1": { x: 1000.0, y: 260.0, r: 84.0, t: "S1" },
  "k12": { x: 147.4, y: 300.0, r: 60.0, t: "K12" },
  "s2": { x: 1220.0, y: 340.0, r: 76.0, t: "S2" },
  "s3": { x: 1308.6, y: 340.0, r: 60.0, t: "S3" },
  "k6": { x: 960.0, y: 147.4, r: 60.0, t: "K6" },
  "s10": { x: 1220.0, y: 160.0, r: 68.0, t: "S10" },
  "s4": { x: 560.0, y: 500.0, r: 76.0, t: "S4" },
  "s9": { x: 780.0, y: 500.0, r: 84.0, t: "S9" },
  "s5": { x: 780.0, y: 547.6, r: 68.0, t: "S5" },
  "c5": { x: 560.0, y: 547.6, r: 60.0, t: "C5" },
  "s6": { x: 1000.0, y: 543.6, r: 76.0, t: "S6" },
  "s7": { x: 1220.0, y: 547.6, r: 76.0, t: "S7" },
  "s_ox": { x: 1308.6, y: 547.6, r: 68.0, t: "S_ox" },
  "c7": { x: 960.0, y: 440.0, r: 68.0, t: "C7" },
};'''
html = re.sub(saved_old, saved_new, html, flags=re.DOTALL)

with io.open('red-residuos-organicos.html', 'w', encoding='utf-8') as f:
    f.write(html)
