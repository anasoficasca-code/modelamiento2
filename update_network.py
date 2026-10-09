import io, re

with io.open('red-residuos-organicos.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace MACRO
macro_new = '''const MACRO = [
  { id:"c1", corto:"C1", full:"C1: Sobrecarga de masa alimentaria", color:"#3b82f6" },
  { id:"k1", corto:"K1", full:"K1: Volumen de alimentos (5,4 a 5,7M ton/a\u00f1o)", color:"#64748b" },
  { id:"k1_2", corto:"K1.2", full:"K1.2: Entrada de 3,86M de veh\u00edculos de carga/a\u00f1o", color:"#64748b" },
  { id:"c2", corto:"C2", full:"C2: Arribo nocturno desacoplado", color:"#3b82f6" },
  { id:"s1", corto:"S1", full:"S1: Represamiento de 1.500 camiones en v\u00eda", color:"#ef4444" },
  { id:"k12", corto:"K12", full:"K12: Ausencia de puertos secos perif\u00e9ricos", color:"#64748b" },
  { id:"s2", corto:"S2", full:"S2: Ocupaci\u00f3n no autorizada de andenes con pucheros", color:"#ef4444" },
  { id:"s3", corto:"S3", full:"S3: Desplazamiento del peat\u00f3n a la calzada vehicular", color:"#ef4444" },
  { id:"k6", corto:"K6", full:"K6: Portones a 90\u00b0", color:"#64748b" },
  { id:"s10", corto:"S10", full:"S10: Colapso del transporte p\u00fablico SITP/TransMilenio", color:"#ef4444" },
  { id:"s4", corto:"S4", full:"S4: Acumulaci\u00f3n de m\u00e1s de 40.000 t/a\u00f1o de residuos", color:"#ef4444" },
  { id:"s9", corto:"S9", full:"S9: Compactaci\u00f3n del suelo de ronda", color:"#ef4444" },
  { id:"s5", corto:"S5", full:"S5: Escorrent\u00eda pluvial de aceites y lixiviados", color:"#ef4444" },
  { id:"c5", corto:"C5", full:"C5: Conexiones erradas por densificaci\u00f3n", color:"#3b82f6" },
  { id:"s6", corto:"S6", full:"S6: Elevaci\u00f3n de Carga DBO5/DQO", color:"#ef4444" },
  { id:"s7", corto:"S7", full:"S7: Eutrofizaci\u00f3n y multiplicaci\u00f3n de buch\u00f3n", color:"#ef4444" },
  { id:"s_ox", corto:"S_ox", full:"S_ox: Ca\u00edda del Ox\u00edgeno Disuelto y anoxia", color:"#ef4444" },
  { id:"c7", corto:"C7", full:"C7: Invasi\u00f3n de ronda", color:"#3b82f6" }
];'''

html = re.sub(r'const MACRO = \[.*?\];', macro_new, html, flags=re.DOTALL)

macro_rel_new = '''const MACRO_REL = [
  { from:"c1", to:"k1", pol:"+", verbo:"Concentrar la oferta alimentaria fija el tonelaje masivo" },
  { from:"k1", to:"k1_2", pol:"+", verbo:"Mayor volumen alimentario exige m\u00e1s veh\u00edculos" },
  { from:"c2", to:"s1", pol:"+", verbo:"Arribo nocturno genera fila de espera" },
  { from:"k1_2", to:"s1", pol:"+", verbo:"Flujo continuo de veh\u00edculos agrava el represamiento" },
  { from:"k12", to:"c1", pol:"+", verbo:"Sin puertos secos, toda la carga entra directo" },
  { from:"s1", to:"s2", pol:"+", verbo:"Permanencia de camiones atrae acopio informal" },
  { from:"s2", to:"s3", pol:"+", verbo:"And\u00e9n bloqueado desplaza peatones a la calle" },
  { from:"k6", to:"s10", pol:"+", verbo:"Giros a 90\u00b0 obligan a frenar en seco" },
  { from:"s1", to:"s10", pol:"+", verbo:"Camiones en v\u00eda trancan carriles compartidos" },
  { from:"k1", to:"s4", pol:"+", verbo:"Actividad comercial desborda recolecci\u00f3n de residuos" },
  { from:"s4", to:"s9", pol:"+", verbo:"Disposici\u00f3n de escombros aplasta suelo protegido" },
  { from:"k1", to:"s9", pol:"+", verbo:"Colindancia f\u00edsica presiona la franja de amortiguaci\u00f3n" },
  { from:"s9", to:"s5", pol:"+", verbo:"Suelo sin vegetaci\u00f3n no filtra aceites" },
  { from:"s5", to:"s6", pol:"+", verbo:"Lixiviados y aceites elevan carga contaminante" },
  { from:"c5", to:"s6", pol:"+", verbo:"Aguas servidas sobrecargan calidad h\u00eddrica" },
  { from:"s6", to:"s7", pol:"+", verbo:"Exceso de nutrientes dispara plantas acu\u00e1ticas" },
  { from:"s7", to:"s_ox", pol:"-", verbo:"Pudrici\u00f3n de plantas consume ox\u00edgeno" },
  { from:"s_ox", to:"s7", pol:"+", verbo:"Muerte org\u00e1nica libera m\u00e1s nutrientes" },
  
  { from:"s2", to:"c1", pol:"+", verbo:"[R1] Oferta informal atrae m\u00e1s masa alimentaria", loop:true },
  { from:"s9", to:"c7", pol:"+", verbo:"[R2] Tierra pelada permite invasi\u00f3n" },
  { from:"c7", to:"s4", pol:"+", verbo:"[R2] Invasi\u00f3n acumula m\u00e1s residuos", loop:true }
];'''

html = re.sub(r'const MACRO_REL = \[.*?\];', macro_rel_new, html, flags=re.DOTALL)

# Empty SUBNETS
html = re.sub(r'const SUBNETS = \{.*?\n\s*\};\n\nconst SAVED_MACRO_POSITIONS = \{', 'const SUBNETS = {};\n\nconst SAVED_MACRO_POSITIONS = {', html, flags=re.DOTALL)

macro_pos_new = '''const SAVED_MACRO_POSITIONS = {
  "k12": { x: 120, y: 300, r: 60 },
  "c1": { x: 340, y: 300, r: 64 },
  "k1": { x: 560, y: 300, r: 60 },
  "k1_2": { x: 780, y: 300, r: 60 },
  "c2": { x: 740, y: 120, r: 60 },
  "s1": { x: 1000, y: 260, r: 64 },
  "s2": { x: 1220, y: 340, r: 60 },
  "s3": { x: 1440, y: 340, r: 60 },
  
  "k6": { x: 960, y: 80, r: 60 },
  "s10": { x: 1220, y: 160, r: 60 },
  
  "s4": { x: 560, y: 500, r: 60 },
  "s9": { x: 780, y: 500, r: 60 },
  "c7": { x: 960, y: 440, r: 60 },
  
  "c5": { x: 560, y: 700, r: 60 },
  "s5": { x: 780, y: 700, r: 60 },
  "s6": { x: 1000, y: 700, r: 64 },
  "s7": { x: 1220, y: 700, r: 60 },
  "s_ox": { x: 1440, y: 700, r: 60 }
};'''

html = re.sub(r'const SAVED_MACRO_POSITIONS = \{.*?\};', macro_pos_new, html, flags=re.DOTALL)

with io.open('red-residuos-organicos.html', 'w', encoding='utf-8') as f:
    f.write(html)
