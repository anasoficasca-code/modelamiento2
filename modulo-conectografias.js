// ============================================================
// Red de interacciones bióticas — Kennedy
// Datos reales: Montoya Quiroga A.M. (2025), Jardín Botánico de
// Bogotá "José Celestino Mutis". DOI 10.15472/8jwhfm.
// Visualización de fuerza dirigida (D3.js), inspirada en el estilo
// de la Red de Interacciones Bióticas de Bogotá (redbiotica.jbb.gov.co):
// nodos por reino (Animal/Planta), líneas por tipo de interacción,
// panel de información al hacer clic en un nodo, zoom y arrastre.
// ============================================================
(function () {
  const DATA_URL = "./assets/kennedy_red_biotica.json";

  const KINGDOM_COLOR = {
    Animal: "#e8743b", Planta: "#5fb85c", Cromista: "#4a9fc7",
    Bacteria: "#c7a24a", Hongo: "#9a6fb0", Protozoario: "#6fb09a",
  };
  const TIPO_COLOR = {
    "Visita floral": "#c77dd1",
    "Herbivoría (frugivoría)": "#d4a24a",
    "Herbivoría": "#8a9a4a",
    "Depredación": "#c4454a",
  };

  const svg = d3.select("#redSvg");
  const root = svg.append("g").attr("class", "zoom-root");
  const linkLayer = root.append("g").attr("class", "links");
  const nodeLayer = root.append("g").attr("class", "nodes");
  const labelLayer = root.append("g").attr("class", "labels");

  let width = window.innerWidth, height = window.innerHeight;
  svg.attr("width", width).attr("height", height);

  const zoomBehavior = d3.zoom()
    .scaleExtent([0.25, 4])
    .on("zoom", (ev) => root.attr("transform", ev.transform));
  svg.call(zoomBehavior);

  document.getElementById("zoomIn").addEventListener("click", () => svg.transition().duration(250).call(zoomBehavior.scaleBy, 1.4));
  document.getElementById("zoomOut").addEventListener("click", () => svg.transition().duration(250).call(zoomBehavior.scaleBy, 1 / 1.4));
  document.getElementById("zoomReset").addEventListener("click", () => svg.transition().duration(400).call(zoomBehavior.transform, d3.zoomIdentity));

  window.addEventListener("resize", () => {
    width = window.innerWidth; height = window.innerHeight;
    svg.attr("width", width).attr("height", height);
    if (simulation) { simulation.force("center", d3.forceCenter(width / 2, height / 2)); simulation.alpha(0.3).restart(); }
  });

  let simulation = null;
  let allNodes = [], allLinks = [];

  function degreeOf(nodeId, links) {
    return links.filter(l => (l.source.id || l.source) === nodeId || (l.target.id || l.target) === nodeId).length;
  }

  function buildInfoHtml(d) {
    const relacionadas = allLinks.filter(l => (l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id);
    const items = relacionadas.map(l => {
      const otroId = (l.source.id || l.source) === d.id ? (l.target.id || l.target) : (l.source.id || l.source);
      const otro = allNodes.find(n => n.id === otroId);
      return `<li><b>${otro ? otro.common : otroId}</b><br>${l.detalle} <span style="color:${TIPO_COLOR[l.tipo] || '#999'};">· ${l.tipo}</span><br><span style="opacity:.7;">${l.zona}</span></li>`;
    }).join("");
    return `
      <div class="info-kind" style="color:${KINGDOM_COLOR[d.kingdom]};">${d.kingdom}</div>
      <h3>${d.id}</h3>
      <p class="common">${d.common !== d.id ? d.common : ""}</p>
      <div class="info-row"><b>Zonas donde se observó</b>${d.zonas.join(", ")}</div>
      <div class="info-row"><b>Interacciones registradas (${relacionadas.length})</b></div>
      <ul class="info-list">${items}</ul>
    `;
  }

  function openInfo(d) {
    document.getElementById("infoBody").innerHTML = buildInfoHtml(d);
    document.getElementById("infoPanel").classList.add("open");
  }
  document.getElementById("infoClose").addEventListener("click", () => {
    document.getElementById("infoPanel").classList.remove("open");
  });

  function applyFilters() {
    const reinos = Array.from(document.querySelectorAll(".f-reino:checked")).map(c => c.value);
    const tipos = Array.from(document.querySelectorAll(".f-tipo:checked")).map(c => c.value);
    const q = document.getElementById("buscador").value.trim().toLowerCase();

    const linksVisibles = allLinks.filter(l => tipos.includes(l.tipo));
    const idsConLink = new Set();
    linksVisibles.forEach(l => { idsConLink.add(l.source.id || l.source); idsConLink.add(l.target.id || l.target); });

    nodeLayer.selectAll("circle").style("display", d => {
      const porReino = reinos.includes(d.kingdom);
      const porLink = idsConLink.has(d.id);
      const porBusqueda = !q || d.id.toLowerCase().includes(q) || d.common.toLowerCase().includes(q);
      return (porReino && porLink && porBusqueda) ? null : "none";
    });
    labelLayer.selectAll("text").style("display", d => {
      const porReino = reinos.includes(d.kingdom);
      const porLink = idsConLink.has(d.id);
      const porBusqueda = !q || d.id.toLowerCase().includes(q) || d.common.toLowerCase().includes(q);
      return (porReino && porLink && porBusqueda) ? null : "none";
    });
    linkLayer.selectAll("line").style("display", l => {
      const tipoOk = tipos.includes(l.tipo);
      const srcOk = reinos.includes((allNodes.find(n => n.id === (l.source.id || l.source)) || {}).kingdom);
      const tgtOk = reinos.includes((allNodes.find(n => n.id === (l.target.id || l.target)) || {}).kingdom);
      return (tipoOk && srcOk && tgtOk) ? null : "none";
    });
  }
  document.querySelectorAll(".f-reino, .f-tipo").forEach(el => el.addEventListener("change", applyFilters));
  document.getElementById("buscador").addEventListener("input", applyFilters);

  fetch(DATA_URL)
    .then(r => { if (!r.ok) throw new Error("no se pudo cargar " + DATA_URL); return r.json(); })
    .then(data => {
      allNodes = data.nodes.map(n => Object.assign({}, n));
      allLinks = data.links.map(l => Object.assign({}, l));

      document.getElementById("redSize").innerHTML =
        `Taxones: <b>${allNodes.length}</b> &nbsp;·&nbsp; Interacciones: <b>${allLinks.length}</b>`;

      const degMax = Math.max(1, ...allNodes.map(n => degreeOf(n.id, allLinks)));

      simulation = d3.forceSimulation(allNodes)
        .force("link", d3.forceLink(allLinks).id(d => d.id).distance(70).strength(0.5))
        .force("charge", d3.forceManyBody().strength(-140))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(d => 8 + (degreeOf(d.id, allLinks) / degMax) * 14));

      const link = linkLayer.selectAll("line").data(allLinks).join("line")
        .attr("stroke", d => TIPO_COLOR[d.tipo] || "#888")
        .attr("stroke-width", 1.4)
        .attr("stroke-opacity", 0.55);

      const node = nodeLayer.selectAll("circle").data(allNodes).join("circle")
        .attr("r", d => 5 + (degreeOf(d.id, allLinks) / degMax) * 11)
        .attr("fill", d => KINGDOM_COLOR[d.kingdom] || "#999")
        .attr("stroke", "#0b0c0f")
        .attr("stroke-width", 1.2)
        .style("cursor", "pointer")
        .on("click", (ev, d) => { ev.stopPropagation(); openInfo(d); })
        .call(d3.drag()
          .on("start", (ev, d) => { if (!ev.active) simulation.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag", (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
          .on("end", (ev, d) => { if (!ev.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

      const label = labelLayer.selectAll("text").data(allNodes).join("text")
        .attr("class", "node-label")
        .attr("dy", d => -(7 + (degreeOf(d.id, allLinks) / degMax) * 11) - 4)
        .text(d => d.common.length > 18 ? d.common.slice(0, 16) + "…" : d.common);

      simulation.on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        node.attr("cx", d => d.x).attr("cy", d => d.y);
        label.attr("x", d => d.x).attr("y", d => d.y);
      });
    })
    .catch(err => {
      console.error("[red biotica]", err);
      document.getElementById("redSize").textContent = "No se pudieron cargar los datos.";
    });
})();
