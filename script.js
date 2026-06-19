
// ─── STATE ────────────────────────────────────────────
let recentCalcs = JSON.parse(localStorage.getItem('bionova_recent') || '[]');
let favorites = JSON.parse(localStorage.getItem('bionova_favorites') || '[]');
let currentCalc = null;
let lastResultData = null;
let _pendingResultData = null;

// ─── SVG ICONS ────────────────────────────────────────
const ICONS = {
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>',
  alert: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>',
  copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  print: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
  star: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  starFilled: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  calculator: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="16" y2="18"/></svg>'
};

// ─── CALCULATOR REGISTRY ──────────────────────────────
const CALCS = {
  // MOLECULAR BIOLOGY
  tm: {
    name: 'DNA Melting Temperature (Tm)',
    module: 'mol', badge: 'badge-mol', moduleLabel: 'Molecular Biology',
    desc: 'Calculate the melting temperature of a DNA oligonucleotide using the basic Wallace rule (for short oligos) or the salt-adjusted formula.',
    formula: 'Basic (Wallace rule): Tm = 2(A+T) + 4(G+C)\nSalt-adjusted: Tm = 81.5 + 16.6·log[Na⁺] + 0.41·(%GC) - 675/n',
    formulaDesc: 'The Wallace rule is used for oligonucleotides shorter than 20 bp. Salt-adjusted formula accounts for ionic strength and primer length (n = number of nucleotides).',
    render: renderTm
  },
  mw: {
    name: 'DNA/RNA Molecular Weight',
    module: 'mol', badge: 'badge-mol', moduleLabel: 'Molecular Biology',
    desc: 'Calculate the molecular weight of a DNA or RNA sequence based on nucleotide composition.',
    formula: 'MW_DNA = (nA×331.2) + (nT×322.2) + (nG×347.2) + (nC×307.2) - (n-1)×17.99\nMW_RNA = (nA×347.2) + (nU×324.2) + (nG×363.2) + (nC×323.2) - (n-1)×17.99',
    formulaDesc: 'Subtracts water molecules for each phosphodiester bond. Valid for single-stranded sequences.',
    render: renderMW
  },
  gc: {
    name: 'GC Content Analyzer',
    module: 'mol', badge: 'badge-mol', moduleLabel: 'Molecular Biology',
    desc: 'Analyze the GC content and nucleotide composition of a DNA or RNA sequence.',
    formula: 'GC% = (G + C) / Total Nucleotides × 100',
    formulaDesc: 'GC content reflects thermal stability of a DNA duplex. Sequences with high GC content have higher Tm due to three hydrogen bonds between G-C pairs.',
    render: renderGC
  },
  pcr: {
    name: 'PCR Master Mix Calculator',
    module: 'mol', badge: 'badge-mol', moduleLabel: 'Molecular Biology',
    desc: 'Calculate reagent volumes for PCR master mix based on number of reactions and template concentration.',
    formula: 'Volume per reaction × Number of reactions = Total volume\nAdd 10% excess to account for pipetting error',
    formulaDesc: 'Standard PCR reaction: 10× buffer, dNTPs, primers, polymerase, template, and water to final volume.',
    render: renderPCR
  },
  copynumber: {
    name: 'DNA Copy Number',
    module: 'mol', badge: 'badge-mol', moduleLabel: 'Molecular Biology',
    desc: 'Calculate the number of DNA copies in a sample from concentration and plasmid/genome size.',
    formula: 'Copies/μL = (Conc. in ng/μL × 6.022×10²³) / (Size in bp × 660 g/mol per bp × 10⁹)',
    formulaDesc: '660 g/mol per base pair is the average molecular weight of a dsDNA base pair. 6.022×10²³ is Avogadro\'s number.',
    render: renderCopyNumber
  },
  restrictiondigest: {
    name: 'Restriction Digest Calculator',
    module: 'mol', badge: 'badge-mol', moduleLabel: 'Molecular Biology',
    desc: 'Calculate volumes for a restriction enzyme digest reaction including DNA, enzyme, buffer, and water.',
    formula: 'Units needed = Amount of DNA (μg) × Units per μg (typically 1–5 U/μg)',
    formulaDesc: 'One unit of restriction enzyme completely digests 1 μg of λ DNA in 60 min at optimal temperature.',
    render: renderRestrictionDigest
  },
  agarose: {
    name: 'Agarose Gel Preparation',
    module: 'mol', badge: 'badge-mol', moduleLabel: 'Molecular Biology',
    desc: 'Calculate agarose mass and buffer volume needed to prepare electrophoresis gel of desired percentage.',
    formula: 'Agarose (g) = (% concentration / 100) × Volume (mL)',
    formulaDesc: 'Agarose concentration determines resolution range. Lower percentages separate larger DNA fragments; higher percentages separate smaller fragments.',
    render: renderAgarose
  },
  // BIOPROCESS
  growthrate: {
    name: 'Cell Growth Rate & Doubling Time',
    module: 'bio', badge: 'badge-bio', moduleLabel: 'Bioprocess Engineering',
    desc: 'Calculate specific growth rate and doubling time from cell density measurements at two time points.',
    formula: 'μ = (ln(N₂) - ln(N₁)) / (t₂ - t₁)\ntd = ln(2) / μ',
    formulaDesc: 'μ is the specific growth rate (h⁻¹). td is the doubling time (h). Assumes exponential growth phase.',
    render: renderGrowthRate
  },
  mu: {
    name: 'Specific Growth Rate (μ) Calculator',
    module: 'bio', badge: 'badge-bio', moduleLabel: 'Bioprocess Engineering',
    desc: 'Calculate specific growth rate using Monod kinetics or from slope of ln(OD) vs time plot.',
    formula: 'μ = μmax × [S] / (Ks + [S])   (Monod)\nor  μ = slope of ln(X) vs t plot',
    formulaDesc: 'Monod equation describes the relationship between specific growth rate and substrate concentration. Ks is the substrate concentration at half-maximal growth.',
    render: renderMu
  },
  biomass: {
    name: 'Biomass Yield & Productivity',
    module: 'bio', badge: 'badge-bio', moduleLabel: 'Bioprocess Engineering',
    desc: 'Calculate biomass yield coefficient and volumetric productivity from fermentation data.',
    formula: 'Y(X/S) = ΔX / ΔS\nQx = ΔX / Δt (g/L/h)',
    formulaDesc: 'Y(X/S) is the yield coefficient (g biomass per g substrate). Qx is volumetric productivity.',
    render: renderBiomass
  },
  substrate: {
    name: 'Substrate Consumption Rate',
    module: 'bio', badge: 'badge-bio', moduleLabel: 'Bioprocess Engineering',
    desc: 'Calculate substrate consumption rate and specific substrate uptake rate.',
    formula: 'qs = μ / Y(X/S)\nQs = qs × X (g/L/h)',
    formulaDesc: 'qs is specific substrate uptake rate (g substrate/g biomass/h). X is biomass concentration.',
    render: renderSubstrate
  },
  media: {
    name: 'Media Preparation Calculator',
    module: 'bio', badge: 'badge-bio', moduleLabel: 'Bioprocess Engineering',
    desc: 'Scale a media recipe from a stock or reference volume to a desired preparation volume.',
    formula: 'Amount needed = (Stock amount / Stock volume) × Target volume',
    formulaDesc: 'Used to scale up or down fermentation media recipes. Assumes linear relationship between components.',
    render: renderMedia
  },
  od600: {
    name: 'OD600 to Cell Density Conversion',
    module: 'bio', badge: 'badge-bio', moduleLabel: 'Bioprocess Engineering',
    desc: 'Convert OD600 absorbance reading to estimated cell concentration for common microorganisms.',
    formula: 'E. coli: cells/mL ≈ OD600 × 8×10⁸\nS. cerevisiae: cells/mL ≈ OD600 × 3×10⁷',
    formulaDesc: 'Conversion factors are organism-specific and strain-dependent. Standard path length: 1 cm.',
    render: renderOD600
  },
  // PLANT TISSUE CULTURE
  ms: {
    name: 'MS Media Preparation Calculator',
    module: 'ptc', badge: 'badge-ptc', moduleLabel: 'Plant Tissue Culture',
    desc: 'Calculate weights of Murashige & Skoog salts required for a given volume of MS media.',
    formula: 'Mass (g) = Concentration (mg/L) × Volume (L) / 1000',
    formulaDesc: 'Full-strength MS media contains specific macro and micronutrient concentrations. Half-strength (½ MS) uses 50% of stock concentrations.',
    render: renderMS
  },
  pgr: {
    name: 'Plant Growth Regulator Concentration',
    module: 'ptc', badge: 'badge-ptc', moduleLabel: 'Plant Tissue Culture',
    desc: 'Calculate PGR stock solution concentration and volume to add to reach desired final concentration.',
    formula: 'C₁V₁ = C₂V₂\nStock volume = (C₂ × V₂) / C₁',
    formulaDesc: 'Used for auxins (IAA, IBA, NAA, 2,4-D), cytokinins (BAP, Kinetin, Zeatin), and gibberellins.',
    render: renderPGR
  },
  dilution: {
    name: 'Stock Solution & Dilution Calculator',
    module: 'ptc', badge: 'badge-ptc', moduleLabel: 'Plant Tissue Culture',
    desc: 'Calculate dilution volumes and concentration factors for stock solutions used in tissue culture.',
    formula: 'C₁V₁ = C₂V₂\nDilution factor = C₁ / C₂',
    formulaDesc: 'Used for preparing working solutions from concentrated stock solutions. Applicable to all soluble reagents.',
    render: renderDilution
  },
  multiplication: {
    name: 'Explant Multiplication Rate',
    module: 'ptc', badge: 'badge-ptc', moduleLabel: 'Plant Tissue Culture',
    desc: 'Calculate explant multiplication rate and projected number of plantlets over multiple subculture cycles.',
    formula: 'Total = Initial × Rate^n\nMR = Final count / Initial count',
    formulaDesc: 'n = number of subculture cycles. MR = multiplication rate per cycle. Assumes constant multiplication rate.',
    render: renderMultiplication
  },
  agarsugar: {
    name: 'Agar & Sucrose Requirement',
    module: 'ptc', badge: 'badge-ptc', moduleLabel: 'Plant Tissue Culture',
    desc: 'Calculate agar and sucrose quantities required for tissue culture media preparation.',
    formula: 'Agar (g) = % agar × Volume (mL) / 100\nSucrose (g) = % sucrose × Volume (mL) / 100',
    formulaDesc: 'Typical TC media: 0.6–0.8% agar (6–8 g/L), 3% sucrose (30 g/L). Gelrite requires 0.2–0.3%.',
    render: renderAgarSugar
  },
  survival: {
    name: 'Survival Percentage Calculator',
    module: 'ptc', badge: 'badge-ptc', moduleLabel: 'Plant Tissue Culture',
    desc: 'Calculate explant survival percentage after tissue culture procedures.',
    formula: 'Survival % = (Surviving explants / Total explants) × 100',
    formulaDesc: 'Measure at defined time points (e.g., 2 weeks, 4 weeks post-inoculation). Contamination-free criterion required.',
    render: renderSurvival
  },
  // MICROBIOLOGY & GENERAL LAB
  molarity: {
    name: 'Molarity & Normality Calculator',
    module: 'mic', badge: 'badge-mic', moduleLabel: 'Microbiology & Lab',
    desc: 'Calculate molar concentration, normality, mass required, or volume needed for solution preparation.',
    formula: 'M = n / V (mol/L)\nN = M × n factor\nm = M × V × MW',
    formulaDesc: 'M = molarity, n = moles, V = volume in L, N = normality, MW = molecular weight, n factor = valence.',
    render: renderMolarity
  },
  serialdilution: {
    name: 'Serial Dilution Calculator',
    module: 'mic', badge: 'badge-mic', moduleLabel: 'Microbiology & Lab',
    desc: 'Calculate concentrations at each step of a serial dilution and volumes for a given dilution factor.',
    formula: 'Cn = C₀ × (Vt/Vt+Vs)^n\nDilution factor = Vs / (Vs + Vd)',
    formulaDesc: 'C₀ = initial concentration, n = step number, Vs = sample volume, Vd = diluent volume.',
    render: renderSerialDilution
  },
  buffer: {
    name: 'Buffer Preparation Calculator',
    module: 'mic', badge: 'badge-mic', moduleLabel: 'Microbiology & Lab',
    desc: 'Calculate volumes of acid and conjugate base required to prepare a buffer using Henderson-Hasselbalch.',
    formula: 'pH = pKa + log([A⁻]/[HA])\nRatio = 10^(pH - pKa)',
    formulaDesc: 'Henderson-Hasselbalch equation. Valid when pH is within ±1 unit of pKa. Total volume distributes between acid and base forms.',
    render: renderBuffer
  },
  pct: {
    name: 'Percentage Solution Calculator',
    module: 'mic', badge: 'badge-mic', moduleLabel: 'Microbiology & Lab',
    desc: 'Calculate mass/volume, volume/volume, or weight/weight percentage solutions.',
    formula: '% (w/v) = (mass g / volume mL) × 100\n% (v/v) = (volume₁ / total volume) × 100',
    formulaDesc: 'w/v: grams per 100 mL. v/v: mL per 100 mL. w/w: grams per 100 g. Most biological solutions use w/v.',
    render: renderPct
  },
  cfu: {
    name: 'Colony Forming Unit (CFU) Calculator',
    module: 'mic', badge: 'badge-mic', moduleLabel: 'Microbiology & Lab',
    desc: 'Calculate original sample concentration (CFU/mL) from colony counts on plating plates.',
    formula: 'CFU/mL = Colony count / (Dilution factor × Volume plated in mL)',
    formulaDesc: 'Count plates with 30–300 colonies for statistical validity. Average triplicate counts when possible.',
    render: renderCFU
  },
  rpmrcf: {
    name: 'RPM ↔ RCF Converter',
    module: 'mic', badge: 'badge-mic', moduleLabel: 'Microbiology & Lab',
    desc: 'Convert between RPM (revolutions per minute) and RCF (relative centrifugal force, × g).',
    formula: 'RCF = 1.118 × 10⁻⁵ × r × N²\nRPM = √(RCF / (1.118 × 10⁻⁵ × r))',
    formulaDesc: 'r = radius in mm (from center to sample), N = RPM. RCF is also called × g force.',
    render: renderRPMRCF
  },
  ph: {
    name: 'pH Calculator',
    module: 'mic', badge: 'badge-mic', moduleLabel: 'Microbiology & Lab',
    desc: 'Calculate pH from H⁺ concentration, or pOH, or Ka/Kb values.',
    formula: 'pH = -log[H⁺]\npOH = -log[OH⁻]\npH + pOH = 14 (at 25°C)',
    formulaDesc: 'For weak acids: pH ≈ ½(pKa - log C). For weak bases: pOH ≈ ½(pKb - log C).',
    render: renderPH
  },
  unitconv: {
    name: 'Unit Conversion Tools',
    module: 'mic', badge: 'badge-mic', moduleLabel: 'Microbiology & Lab',
    desc: 'Convert between common laboratory units: mass, volume, concentration, and temperature.',
    formula: 'Various unit relationships and conversion factors',
    formulaDesc: 'Comprehensive unit conversion for mass (g, mg, μg, ng), volume (L, mL, μL, nL), concentration, and temperature (°C, °F, K).',
    render: renderUnitConv
  }
};

// Search index
const SEARCH_INDEX = Object.entries(CALCS).map(([id, c]) => ({id, name: c.name, badge: c.badge, module: c.module}));

// ─── VIEW MANAGEMENT ──────────────────────────────────
function showView(v) {
  document.getElementById('view-home').style.display = 'none';
  document.getElementById('view-calc').classList.remove('active');
  document.getElementById('view-refs').style.display = 'none';
  if (v === 'home') {
    document.getElementById('view-home').style.display = 'block';
    renderRecent();
    renderFavorites();
  } else if (v === 'calc') {
    document.getElementById('view-calc').classList.add('active');
  } else if (v === 'refs') {
    document.getElementById('view-refs').style.display = 'block';
  }
  updateMobileNav(v);
  closeSidebar();
  if (v !== 'calc') {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

function updateMobileNav(v) {
  document.querySelectorAll('.mob-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === v);
  });
}

function openModule(mod) {
  const modEl = document.querySelector(`.sidebar-module[data-module="${mod}"]`);
  if (modEl) {
    const header = modEl.querySelector('.module-header');
    const items = modEl.querySelector('.module-items');
    header.classList.add('open');
    items.classList.add('open');
    if (window.innerWidth <= 768) openSidebar();
  }
  showView('home');
}

function openCalc(id) {
  currentCalc = id;
  const c = CALCS[id];
  if (!c) return;
  updateSidebarActive(id);
  const isFav = favorites.includes(id);
  const view = document.getElementById('view-calc');
  view.innerHTML = `
    <div class="calc-header">
      <div class="calc-breadcrumb">
        <a onclick="showView('home')">Home</a> ›
        <span>${c.moduleLabel}</span> ›
        <span>${c.name}</span>
      </div>
      <div class="calc-header-top">
        <div>
          <div class="calc-title">${c.name}</div>
          <div class="calc-subtitle">${c.desc}</div>
        </div>
        <button class="btn-fav ${isFav ? 'active' : ''}" id="favBtn" onclick="toggleFavorite('${id}')" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
          ${isFav ? ICONS.starFilled : ICONS.star}
        </button>
      </div>
    </div>
    <div id="calcBody"></div>
    <div class="formula-card">
      <h3>Formula Reference</h3>
      <div class="formula-box">${c.formula}</div>
      <div class="formula-desc">${c.formulaDesc}</div>
    </div>
  `;
  c.render(document.getElementById('calcBody'));
  showView('calc');
  location.hash = id;
}

function updateSidebarActive(id) {
  document.querySelectorAll('.module-item').forEach(el => el.classList.remove('active'));
  const item = document.querySelector(`.module-item[data-calc="${id}"]`);
  if (item) item.classList.add('active');
}

// ─── SIDEBAR ──────────────────────────────────────────
function toggleModule(header) {
  header.classList.toggle('open');
  header.nextElementSibling.classList.toggle('open');
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('visible');
  document.getElementById('sidebarOverlay').setAttribute('aria-hidden', 'false');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
  document.getElementById('sidebarOverlay').setAttribute('aria-hidden', 'true');
}

function toggleSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('open')) closeSidebar();
  else openSidebar();
}

// ─── FAVORITES ────────────────────────────────────────
function toggleFavorite(id) {
  const idx = favorites.indexOf(id);
  if (idx >= 0) favorites.splice(idx, 1);
  else favorites.push(id);
  localStorage.setItem('bionova_favorites', JSON.stringify(favorites));
  const btn = document.getElementById('favBtn');
  if (btn) {
    const isFav = favorites.includes(id);
    btn.classList.toggle('active', isFav);
    btn.innerHTML = isFav ? ICONS.starFilled : ICONS.star;
    btn.title = isFav ? 'Remove from favorites' : 'Add to favorites';
  }
  renderFavorites();
  showToast(idx >= 0 ? 'Removed from favorites' : 'Added to favorites');
}

function renderFavorites() {
  const sec = document.getElementById('favoritesSection');
  const list = document.getElementById('favoritesList');
  const sideSec = document.getElementById('sidebarFavorites');
  const sideList = document.getElementById('sidebarFavList');
  if (!favorites.length) {
    if (sec) sec.style.display = 'none';
    if (sideSec) sideSec.style.display = 'none';
    return;
  }
  const html = favorites.filter(id => CALCS[id]).map(id => `
    <div class="fav-card" onclick="openCalc('${id}')">
      ${ICONS.starFilled.replace('width="20"', 'width="14"').replace('height="20"', 'height="14"')}
      <span>${CALCS[id].name}</span>
    </div>`).join('');
  const sideHtml = favorites.filter(id => CALCS[id]).map(id => `
    <div class="sidebar-fav-item" onclick="openCalc('${id}')">${CALCS[id].name}</div>`).join('');
  if (sec) { sec.style.display = 'block'; list.innerHTML = html; }
  if (sideSec) { sideSec.style.display = 'block'; sideList.innerHTML = sideHtml; }
}

function openRandomCalc() {
  const ids = Object.keys(CALCS);
  openCalc(ids[Math.floor(Math.random() * ids.length)]);
}

function confirmClearRecent() {
  openModal('confirm', {
    title: 'Clear Recent History?',
    message: 'This will remove all recent calculation entries. This cannot be undone.',
    onConfirm: () => {
      recentCalcs = [];
      localStorage.setItem('bionova_recent', '[]');
      renderRecent();
      showToast('Recent history cleared');
      closeModal();
    }
  });
}

// ─── FONT SIZE ────────────────────────────────────────
function setFontSize(scale) {
  document.documentElement.style.setProperty('--fs-scale', scale);
  localStorage.setItem('bionova_fs', scale);
  document.querySelectorAll('.fs-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.fs === String(scale));
  });
}

// ─── MODALS ───────────────────────────────────────────
const MODAL_CONTENT = {
  welcome: () => `
    <h2>Welcome to BioNova</h2>
    <p class="modal-sub">Your all-in-one life sciences calculation suite with 27 precision tools across 4 modules.</p>
    <div class="modal-steps">
      <div class="modal-step"><span class="modal-step-num">1</span><div class="modal-step-text"><strong>Browse modules</strong>Use the sidebar or module cards on the home page.</div></div>
      <div class="modal-step"><span class="modal-step-num">2</span><div class="modal-step-text"><strong>Calculate</strong>Enter values and get step-by-step breakdowns.</div></div>
      <div class="modal-step"><span class="modal-step-num">3</span><div class="modal-step-text"><strong>Export &amp; share</strong>Copy, export, or print results. Share links via URL hash.</div></div>
    </div>
    <div class="modal-actions">
      <button class="btn-primary" onclick="closeModal();openModal('quickstart')">Quick Start Guide</button>
      <button class="btn-secondary" onclick="closeModal()">Get Started</button>
    </div>`,
  quickstart: () => `
    <h2>Quick Start Guide</h2>
    <p class="modal-sub">Get productive in four simple steps.</p>
    <div class="modal-steps">
      <div class="modal-step"><span class="modal-step-num">1</span><div class="modal-step-text"><strong>Find a calculator</strong>Search with <span class="modal-kbd">/</span> or browse the sidebar modules.</div></div>
      <div class="modal-step"><span class="modal-step-num">2</span><div class="modal-step-text"><strong>Enter your data</strong>Fill in the form fields and click Calculate.</div></div>
      <div class="modal-step"><span class="modal-step-num">3</span><div class="modal-step-text"><strong>Review results</strong>See step-by-step math and copy or export the output.</div></div>
      <div class="modal-step"><span class="modal-step-num">4</span><div class="modal-step-text"><strong>Star favorites</strong>Click the star icon to save frequently used calculators.</div></div>
    </div>
    <div class="modal-actions"><button class="btn-primary" onclick="closeModal()">Got it!</button></div>`,
  help: () => `
    <h2>Help &amp; Shortcuts</h2>
    <p class="modal-sub">Tips for getting the most out of BioNova.</p>
    <ul class="modal-list">
      <li><span>Focus search</span><span class="modal-kbd">/</span></li>
      <li><span>Close menus / modals</span><span class="modal-kbd">Esc</span></li>
      <li><span>Print results</span><span class="modal-kbd">Ctrl+P</span></li>
      <li><span>Share calculator link</span><span>Copy URL with #hash</span></li>
    </ul>
    <p class="modal-sub" style="margin-top:0.5rem">Use font size controls (A A A) in the nav to adjust text size. Click reference cards to copy values.</p>
    <div class="modal-actions"><button class="btn-primary" onclick="closeModal()">Close</button></div>`,
  about: () => `
    <h2>About BioNova</h2>
    <p class="modal-sub">BioNova Research Suite v2.0 — a precision calculation platform for molecular biology, bioprocess engineering, plant tissue culture, and microbiology.</p>
    <div class="modal-steps">
      <div class="modal-step"><span class="modal-step-num">27</span><div class="modal-step-text"><strong>Calculators</strong>With step-by-step breakdowns and formula references.</div></div>
      <div class="modal-step"><span class="modal-step-num">4</span><div class="modal-step-text"><strong>Modules</strong>Organized by scientific discipline.</div></div>
    </div>
    <p class="modal-sub" style="text-align:center;margin-top:1rem">Developed by <strong style="color:var(--accent)">Balamurugan R</strong></p>
    <div class="modal-actions"><button class="btn-primary" onclick="closeModal()">Close</button></div>`
};

let _confirmCallback = null;

function openModal(type, opts = {}) {
  const backdrop = document.getElementById('modalBackdrop');
  const content = document.getElementById('modalContent');
  if (type === 'confirm') {
    _confirmCallback = opts.onConfirm || null;
    content.innerHTML = `
      <h2>${opts.title || 'Confirm'}</h2>
      <p class="modal-sub">${opts.message || ''}</p>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn-primary" style="background:linear-gradient(135deg,var(--danger),#dc2626)" onclick="runConfirm()">Confirm</button>
      </div>`;
  } else if (MODAL_CONTENT[type]) {
    content.innerHTML = MODAL_CONTENT[type]();
  }
  backdrop.classList.add('open');
  backdrop.setAttribute('aria-hidden', 'false');
}

function runConfirm() {
  if (_confirmCallback) _confirmCallback();
  _confirmCallback = null;
}

function closeModal() {
  const backdrop = document.getElementById('modalBackdrop');
  backdrop.classList.remove('open');
  backdrop.setAttribute('aria-hidden', 'true');
}

// ─── COPY / EXPORT / PRINT ────────────────────────────
function copyResult(data) {
  const d = data || lastResultData;
  if (!d) return;
  const lines = Object.entries(d).map(([k, v]) => `${k}: ${v}`).join('\n');
  const text = `BioNova Calculation Result\n${'─'.repeat(30)}\n${lines}\n\nCalculated: ${new Date().toLocaleString()}`;
  navigator.clipboard.writeText(text).then(() => showToast('Result copied to clipboard!')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    showToast('Result copied!');
  });
}

function quickCopyResult() {
  copyResult(lastResultData);
}

function printResult() {
  window.print();
}

function handleHashRoute() {
  const id = location.hash.replace('#', '');
  if (id && CALCS[id]) openCalc(id);
}

function filterRefs(q) {
  const query = q.trim().toLowerCase();
  document.querySelectorAll('.ref-card').forEach(card => {
    const text = (card.textContent + ' ' + (card.dataset.keywords || '')).toLowerCase();
    card.classList.toggle('hidden', query && !text.includes(query));
  });
}

function copyRefCard(card) {
  const val = card.querySelector('.ref-value');
  if (!val) return;
  const text = val.innerText.replace(/\n/g, ' | ');
  navigator.clipboard.writeText(text).then(() => showToast('Reference copied!')).catch(() => showToast('Copy failed', 'error'));
}

// ─── SEARCH ───────────────────────────────────────────
const searchInput = document.getElementById('globalSearch');
const searchResults = document.getElementById('searchResults');
searchInput.addEventListener('input', function() {
  const q = this.value.trim().toLowerCase();
  if (!q) { searchResults.classList.remove('open'); return; }
  const filtered = SEARCH_INDEX.filter(c => c.name.toLowerCase().includes(q));
  if (!filtered.length) { searchResults.classList.remove('open'); return; }
  searchResults.innerHTML = filtered.map(c => `
    <div class="search-item" onclick="openCalc('${c.id}'); searchResults.classList.remove('open'); searchInput.value='';">
      <span class="search-item-badge ${c.badge}">${c.module}</span>
      <span class="search-item-name">${c.name}</span>
    </div>`).join('');
  searchResults.classList.add('open');
});
document.addEventListener('click', e => {
  if (!document.querySelector('.nav-search').contains(e.target)) searchResults.classList.remove('open');
});

// ─── RECENT CALCULATIONS ──────────────────────────────
function addRecent(id, summary) {
  recentCalcs = recentCalcs.filter(r => r.id !== id);
  recentCalcs.unshift({ id, name: CALCS[id].name, summary, time: new Date().toLocaleTimeString() });
  if (recentCalcs.length > 5) recentCalcs.pop();
  localStorage.setItem('bionova_recent', JSON.stringify(recentCalcs));
}
function renderRecent() {
  const sec = document.getElementById('recentSection');
  const list = document.getElementById('recentList');
  if (!recentCalcs.length) { sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  list.innerHTML = recentCalcs.map(r => `
    <div class="recent-item" onclick="openCalc('${r.id}')">
      <span class="recent-name">${r.name} — <span style="color:var(--text-dim);font-size:0.8rem;">${r.summary}</span></span>
      <span class="recent-time">${r.time}</span>
    </div>`).join('');
}

// ─── TOAST ────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  document.getElementById('toastIcon').innerHTML = type === 'success' ? ICONS.check : ICONS.alert;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── HELPERS ──────────────────────────────────────────
function fmtNum(n, decimals = 4) {
  if (isNaN(n) || !isFinite(n)) return 'Error';
  if (Math.abs(n) >= 1e6 || (Math.abs(n) < 0.001 && n !== 0)) return n.toExponential(3);
  return parseFloat(n.toFixed(decimals)).toString();
}
function card(content) {
  return `<div class="form-card">${content}</div>`;
}
function resultPanel(id = 'resultPanel') {
  return `<div class="result-panel" id="${id}">
    <div class="result-panel-header">
      <h3>Result</h3>
      <div class="result-header-actions">
        <button class="btn-icon" id="quickCopy_${id}" onclick="quickCopyResult()" title="Copy result" disabled>${ICONS.copy}</button>
        <button class="btn-icon" onclick="printResult()" title="Print result">${ICONS.print}</button>
      </div>
    </div>
    <div class="result-body">
      <div class="result-empty">${ICONS.calculator}<p>Enter values and calculate</p></div>
    </div>
  </div>`;
}
function showResult(panelId, html) {
  const p = document.getElementById(panelId);
  if (p) p.querySelector('.result-body').innerHTML = html;
  if (_pendingResultData) {
    lastResultData = _pendingResultData;
    _pendingResultData = null;
    const btn = document.getElementById('quickCopy_' + panelId);
    if (btn) btn.disabled = false;
  }
}
function mainResult(label, value, unit = '') {
  return `<div class="result-main"><div class="result-label">${label}</div><div class="result-value">${value}<span class="result-unit">${unit}</span></div></div>`;
}
function multiResults(items) {
  return `<div class="multi-results">${items.map(([l,v]) => `<div class="result-item"><span class="result-item-label">${l}</span><span class="result-item-value">${v}</span></div>`).join('')}</div>`;
}
function steps(...ss) {
  return `<div class="result-steps"><h4>Step-by-step</h4>${ss.map((s,i) => `<div class="step"><span class="step-num">${i+1}</span><div class="step-text">${s}</div></div>`).join('')}</div>`;
}
function exportBtn(data) {
  _pendingResultData = data;
  const json = JSON.stringify(data).replace(/'/g, "\\'");
  return `<div class="result-actions-row">
    <button class="btn-export" onclick='copyResult(${json})'>${ICONS.copy} Copy</button>
    <button class="btn-export" onclick='exportResult(${json})'>${ICONS.download} Export</button>
    <button class="btn-export" onclick="printResult()">${ICONS.print} Print</button>
  </div>`;
}
function exportResult(data) {
  const lines = Object.entries(data).map(([k,v]) => `${k}: ${v}`).join('\n');
  const blob = new Blob([`BioNova Calculation Result\n${'─'.repeat(30)}\n${lines}\n\nCalculated: ${new Date().toLocaleString()}`], {type:'text/plain'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bionova_result.txt'; a.click();
  showToast('Result exported!');
}
function calcBody(formHtml, panelId = 'resultPanel') {
  return `<div class="calc-body">${card(formHtml)}${resultPanel(panelId)}</div>`;
}

// ─── MOLECULAR BIOLOGY CALCULATORS ───────────────────

function renderTm(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>DNA Sequence <span>(5'→3')</span></label>
      <textarea id="tm_seq" placeholder="ATCGATCGATCG…" rows="4"></textarea>
      <div class="field-hint">Enter nucleotides (A, T, G, C). Spaces and line breaks ignored.</div>
      <div class="field-error" id="tm_seq_err">Please enter a valid DNA sequence (A, T, G, C only).</div>
    </div>
    <div class="field"><label>Method</label>
      <select id="tm_method">
        <option value="wallace">Wallace Rule (Basic, &lt;20 bp)</option>
        <option value="salt">Salt-Adjusted Formula</option>
      </select>
    </div>
    <div id="tm_salt_fields" style="display:none">
      <div class="field-row">
        <div class="field"><label>Na⁺ Concentration <span>(M)</span></label><input type="number" id="tm_na" value="0.05" step="0.001" min="0.001"></div>
        <div class="field"><label>Primer Length <span>(bp)</span></label><input type="number" id="tm_n" placeholder="auto"></div>
      </div>
    </div>
    <button class="btn-calc" onclick="calcTm()">Calculate Tm</button>
    <button class="btn-reset" onclick="renderTm(document.getElementById('calcBody'))">Reset</button>
  `);
  document.getElementById('tm_method').addEventListener('change', function() {
    document.getElementById('tm_salt_fields').style.display = this.value === 'salt' ? 'block' : 'none';
  });
}

function calcTm() {
  const seq = document.getElementById('tm_seq').value.replace(/\s/g,'').toUpperCase();
  const valid = /^[ATGC]+$/.test(seq);
  const field = document.getElementById('tm_seq').closest('.field');
  field.classList.toggle('error', !valid);
  if (!valid || !seq) return;
  const A = (seq.match(/A/g)||[]).length, T = (seq.match(/T/g)||[]).length;
  const G = (seq.match(/G/g)||[]).length, C = (seq.match(/C/g)||[]).length;
  const method = document.getElementById('tm_method').value;
  let Tm, methodName;
  if (method === 'wallace') {
    Tm = 2*(A+T) + 4*(G+C);
    methodName = 'Wallace Rule';
  } else {
    const Na = parseFloat(document.getElementById('tm_na').value)||0.05;
    const n_val = document.getElementById('tm_n').value;
    const n = n_val ? parseInt(n_val) : seq.length;
    const gc = (G+C)/seq.length*100;
    Tm = 81.5 + 16.6*Math.log10(Na) + 0.41*gc - 675/n;
    methodName = 'Salt-Adjusted';
  }
  const gc_pct = ((G+C)/seq.length*100).toFixed(1);
  addRecent('tm', `Tm = ${fmtNum(Tm,1)}°C`);
  showResult('resultPanel', `
    ${mainResult('Melting Temperature (Tm)', fmtNum(Tm,1), '°C')}
    ${multiResults([['Method',methodName],['GC Content',gc_pct+'%'],['Length',seq.length+' bp'],['A',A],['T',T],['G',G],['C',C]])}
    ${steps(`Sequence: <code>${seq.substring(0,30)}${seq.length>30?'…':''}</code> (${seq.length} bp)`,
      method==='wallace'?`Wallace rule: Tm = 2×(A+T) + 4×(G+C) = 2×${A+T} + 4×${G+C}`:`Salt-adjusted formula with Na⁺ = ${document.getElementById('tm_na').value} M`,
      `Result: <code>Tm = ${fmtNum(Tm,1)} °C</code>`)}
    ${exportBtn({'Calculator':'DNA Melting Temperature','Sequence':seq,'Method':methodName,'Tm (°C)':fmtNum(Tm,1),'GC%':gc_pct,'Length (bp)':seq.length})}
  `);
  showToast(`Tm = ${fmtNum(Tm,1)}°C`);
}

function renderMW(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>Sequence <span>(single-stranded)</span></label>
      <textarea id="mw_seq" placeholder="ATCGATCG… or AUCGAUC…" rows="4"></textarea>
    </div>
    <div class="field"><label>Molecule Type</label>
      <select id="mw_type"><option value="dna">DNA</option><option value="rna">RNA</option></select>
    </div>
    <button class="btn-calc" onclick="calcMW()">Calculate MW</button>
    <button class="btn-reset" onclick="renderMW(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcMW() {
  const raw = document.getElementById('mw_seq').value.replace(/\s/g,'').toUpperCase();
  const type = document.getElementById('mw_type').value;
  const valid = type==='dna' ? /^[ATGC]+$/.test(raw) : /^[AUGC]+$/.test(raw);
  if (!valid || !raw) { showToast('Invalid sequence for '+type.toUpperCase(),'error'); return; }
  const wts = type==='dna' ? {A:331.2,T:322.2,G:347.2,C:307.2} : {A:347.2,U:324.2,G:363.2,C:323.2};
  let mw = 0;
  for (const ch of raw) mw += wts[ch]||0;
  mw -= (raw.length-1)*17.99;
  const n = raw.length;
  addRecent('mw', `MW = ${fmtNum(mw/1000,2)} kDa`);
  showResult('resultPanel', `
    ${mainResult('Molecular Weight', fmtNum(mw,1), 'Da')}
    ${multiResults([['MW (kDa)',fmtNum(mw/1000,3)],['Length',n+' nt'],['Type',type.toUpperCase()]])}
    ${steps(`Count each nucleotide in the ${type.toUpperCase()} sequence`,`Sum MW = Σ(base weights) = ${fmtNum(mw+17.99*(n-1),1)} Da`,`Subtract ${n-1} water molecules: ${fmtNum(mw,1)} Da`)}
    ${exportBtn({'Calculator':'Molecular Weight','Type':type.toUpperCase(),'Length (nt)':n,'MW (Da)':fmtNum(mw,1),'MW (kDa)':fmtNum(mw/1000,3)})}
  `);
}

function renderGC(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>DNA/RNA Sequence</label>
      <textarea id="gc_seq" placeholder="ATCGATCGATCGGCAATGC…" rows="5"></textarea>
    </div>
    <button class="btn-calc" onclick="calcGC()">Analyze</button>
    <button class="btn-reset" onclick="renderGC(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcGC() {
  const seq = document.getElementById('gc_seq').value.replace(/\s/g,'').toUpperCase();
  if (!seq) return;
  const A=(seq.match(/A/g)||[]).length, T=(seq.match(/T/g)||[]).length;
  const G=(seq.match(/G/g)||[]).length, C=(seq.match(/C/g)||[]).length;
  const U=(seq.match(/U/g)||[]).length;
  const total=seq.length, gc=(G+C)/total*100, at=(A+T+U)/total*100;
  addRecent('gc', `GC = ${gc.toFixed(1)}%`);
  showResult('resultPanel', `
    ${mainResult('GC Content', gc.toFixed(2), '%')}
    ${multiResults([['AT/AU Content',at.toFixed(2)+'%'],['Adenine (A)',A+' ('+((A/total)*100).toFixed(1)+'%)'],['Thymine (T)',T+' ('+((T/total)*100).toFixed(1)+'%)'],['Guanine (G)',G+' ('+((G/total)*100).toFixed(1)+'%)'],['Cytosine (C)',C+' ('+((C/total)*100).toFixed(1)+'%)'],['Total length',total+' nt']])}
    ${steps(`Sequence length: ${total} nucleotides`,`GC = (G+C)/Total × 100 = (${G}+${C})/${total} × 100`,`GC Content = <code>${gc.toFixed(2)}%</code>`)}
    ${exportBtn({'GC%':gc.toFixed(2),'AT%':at.toFixed(2),'Length':total})}
  `);
}

function renderPCR(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>Number of Reactions</label><input type="number" id="pcr_n" value="10" min="1"></div>
      <div class="field"><label>Reaction Volume <span>(μL)</span></label><input type="number" id="pcr_vol" value="25" min="5"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Buffer (10×) Vol. <span>(μL/rxn)</span></label><input type="number" id="pcr_buf" value="2.5"></div>
      <div class="field"><label>dNTPs Vol. <span>(μL/rxn)</span></label><input type="number" id="pcr_dntp" value="0.5"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Fwd Primer Vol. <span>(μL/rxn)</span></label><input type="number" id="pcr_fp" value="1"></div>
      <div class="field"><label>Rev Primer Vol. <span>(μL/rxn)</span></label><input type="number" id="pcr_rp" value="1"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Polymerase Vol. <span>(μL/rxn)</span></label><input type="number" id="pcr_pol" value="0.25"></div>
      <div class="field"><label>Template Vol. <span>(μL/rxn)</span></label><input type="number" id="pcr_tmpl" value="1"></div>
    </div>
    <button class="btn-calc" onclick="calcPCR()">Calculate Mix</button>
    <button class="btn-reset" onclick="renderPCR(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcPCR() {
  const n = parseFloat(document.getElementById('pcr_n').value)||10;
  const rxn = parseFloat(document.getElementById('pcr_vol').value)||25;
  const nn = n * 1.1; // 10% excess
  const buf=parseFloat(document.getElementById('pcr_buf').value), dntp=parseFloat(document.getElementById('pcr_dntp').value);
  const fp=parseFloat(document.getElementById('pcr_fp').value), rp=parseFloat(document.getElementById('pcr_rp').value);
  const pol=parseFloat(document.getElementById('pcr_pol').value), tmpl=parseFloat(document.getElementById('pcr_tmpl').value);
  const sumPer = buf+dntp+fp+rp+pol+tmpl;
  const water = rxn - sumPer;
  const f = v => (v*nn).toFixed(1)+' μL';
  addRecent('pcr', `${n} rxns × ${rxn} μL`);
  showResult('resultPanel', `
    ${mainResult('Total Master Mix Volume', (sumPer*nn).toFixed(1), 'μL')}
    <p style="font-size:0.75rem;color:var(--muted);margin-bottom:0.75rem;">Includes 10% excess (${n} × 1.1 = ${nn.toFixed(1)} reactions)</p>
    ${multiResults([['10× Buffer',f(buf)],['dNTPs (10 mM)',f(dntp)],['Forward Primer',f(fp)],['Reverse Primer',f(rp)],['Polymerase',f(pol)],['Water (per rxn)',water.toFixed(2)+' μL'],['Template (add separately)',tmpl+' μL/rxn']])}
    ${steps(`Per reaction: ${sumPer} μL mix + ${tmpl} μL template = ${rxn} μL total`,`Add 10% excess: ${n} × 1.1 = ${nn.toFixed(1)} reactions`,`Prepare ${(sumPer*nn).toFixed(1)} μL master mix, aliquot ${(sumPer).toFixed(1)} μL per tube, then add ${tmpl} μL template`)}
    ${exportBtn({'Reactions':n,'Volume/rxn (μL)':rxn,'Total mix (μL)':(sumPer*nn).toFixed(1),'Buffer (μL)':f(buf),'dNTPs (μL)':f(dntp)})}
  `);
}

function renderCopyNumber(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>DNA Concentration <span>(ng/μL)</span></label><input type="number" id="cn_conc" placeholder="50" step="0.001"></div>
      <div class="field"><label>Insert/Plasmid Size <span>(bp)</span></label><input type="number" id="cn_size" placeholder="3000"></div>
    </div>
    <div class="field"><label>Molecule Type</label>
      <select id="cn_type"><option value="ds">dsDNA</option><option value="ss">ssDNA</option></select>
    </div>
    <button class="btn-calc" onclick="calcCopyNumber()">Calculate Copies</button>
    <button class="btn-reset" onclick="renderCopyNumber(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcCopyNumber() {
  const conc=parseFloat(document.getElementById('cn_conc').value);
  const size=parseFloat(document.getElementById('cn_size').value);
  const type=document.getElementById('cn_type').value;
  if (!conc||!size) { showToast('Enter concentration and size','error'); return; }
  const mw_per_bp = type==='ds' ? 660 : 330;
  const copies = (conc * 6.022e23) / (size * mw_per_bp * 1e9);
  addRecent('copynumber', `${fmtNum(copies)} copies/μL`);
  showResult('resultPanel', `
    ${mainResult('Copies per μL', fmtNum(copies), 'copies/μL')}
    ${multiResults([['Scientific notation',copies.toExponential(3)+' copies/μL'],['Copies per mL',fmtNum(copies*1000)+' copies/mL'],['Moles per μL',(copies/6.022e23).toExponential(3)+' mol/μL']])}
    ${steps(`Formula: Copies/μL = (Conc × Avogadro) / (Size × MW per bp × 10⁹)`,`= (${conc} × 6.022×10²³) / (${size} × ${mw_per_bp} × 10⁹)`,`= <code>${copies.toExponential(3)} copies/μL</code>`)}
    ${exportBtn({'Concentration (ng/μL)':conc,'Size (bp)':size,'Type':type,'Copies/μL':copies.toExponential(3)})}
  `);
}

function renderRestrictionDigest(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>DNA Amount <span>(μg)</span></label><input type="number" id="rd_dna" value="1" step="0.1"></div>
      <div class="field"><label>Total Reaction Volume <span>(μL)</span></label><input type="number" id="rd_vol" value="20"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Units per μg DNA <span>(U/μg)</span></label><input type="number" id="rd_upg" value="1" step="0.5"></div>
      <div class="field"><label>Enzyme Conc. <span>(U/μL)</span></label><input type="number" id="rd_econ" value="10"></div>
    </div>
    <div class="field"><label>Buffer Concentration <span>(fold, e.g. 10 for 10×)</span></label>
      <input type="number" id="rd_buf" value="10">
    </div>
    <button class="btn-calc" onclick="calcRD()">Calculate Digest</button>
    <button class="btn-reset" onclick="renderRestrictionDigest(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcRD() {
  const dna=parseFloat(document.getElementById('rd_dna').value)||1;
  const vol=parseFloat(document.getElementById('rd_vol').value)||20;
  const upg=parseFloat(document.getElementById('rd_upg').value)||1;
  const econ=parseFloat(document.getElementById('rd_econ').value)||10;
  const buf=parseFloat(document.getElementById('rd_buf').value)||10;
  const units = dna * upg;
  const enzVol = units / econ;
  const bufVol = vol / buf;
  const water = vol - enzVol - bufVol;
  addRecent('restrictiondigest', `${dna} μg DNA in ${vol} μL`);
  showResult('resultPanel', `
    ${mainResult('Total Reaction Volume', vol, 'μL')}
    ${multiResults([['Enzyme Volume',enzVol.toFixed(2)+' μL'],['Buffer (1×)',bufVol.toFixed(1)+' μL'],[`Water to ${vol} μL`,water.toFixed(2)+' μL'],['Total enzyme units',units+' U']])}
    ${steps(`Units needed: ${dna} μg × ${upg} U/μg = ${units} U`,`Enzyme volume: ${units} U / ${econ} U/μL = ${enzVol.toFixed(2)} μL`,`Buffer: ${vol} μL / ${buf} = ${bufVol.toFixed(1)} μL`,`Water: ${vol} - ${enzVol.toFixed(2)} - ${bufVol.toFixed(1)} = ${water.toFixed(2)} μL`)}
    ${exportBtn({'DNA (μg)':dna,'Reaction volume (μL)':vol,'Enzyme (μL)':enzVol.toFixed(2),'Buffer (μL)':bufVol.toFixed(1),'Water (μL)':water.toFixed(2)})}
  `);
}

function renderAgarose(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>Gel Volume <span>(mL)</span></label><input type="number" id="ag_vol" value="100" min="10"></div>
      <div class="field"><label>Agarose Percentage <span>(%)</span></label><input type="number" id="ag_pct" value="1" step="0.5" min="0.5" max="4"></div>
    </div>
    <div class="field"><label>Buffer</label>
      <select id="ag_buf"><option value="TAE">TAE (1×)</option><option value="TBE">TBE (0.5×)</option><option value="SB">SB buffer</option></select>
    </div>
    <button class="btn-calc" onclick="calcAgarose()">Calculate</button>
    <button class="btn-reset" onclick="renderAgarose(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcAgarose() {
  const vol=parseFloat(document.getElementById('ag_vol').value)||100;
  const pct=parseFloat(document.getElementById('ag_pct').value)||1;
  const buf=document.getElementById('ag_buf').value;
  const agarose_g = (pct/100)*vol;
  const range = pct<=0.5?'>10 kb':pct<=1?'1–10 kb':pct<=1.5?'500 bp–5 kb':pct<=2.5?'100–500 bp':'50–200 bp';
  addRecent('agarose', `${pct}% in ${vol} mL`);
  showResult('resultPanel', `
    ${mainResult('Agarose Required', agarose_g.toFixed(2), 'g')}
    ${multiResults([['Buffer Volume',vol+' mL'],[`Buffer Type`,buf],['Resolution Range',range],['Agarose % (w/v)',pct+'%']])}
    ${steps(`Agarose (g) = (% / 100) × Volume`,`= (${pct} / 100) × ${vol} = <code>${agarose_g.toFixed(2)} g</code>`,`Dissolve in ${vol} mL ${buf} buffer by microwaving until clear. Cool to ~55°C before pouring.`)}
    ${exportBtn({'Volume (mL)':vol,'Concentration (%)':pct,'Agarose (g)':agarose_g.toFixed(2),'Buffer':buf,'Resolution':range})}
  `);
}

// ─── BIOPROCESS CALCULATORS ───────────────────────────

function renderGrowthRate(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>Initial Cell Density <span>(cells/mL or OD)</span></label><input type="number" id="gr_n1" placeholder="0.1" step="0.001"></div>
      <div class="field"><label>Final Cell Density</label><input type="number" id="gr_n2" placeholder="0.8" step="0.001"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Initial Time <span>(h)</span></label><input type="number" id="gr_t1" value="0"></div>
      <div class="field"><label>Final Time <span>(h)</span></label><input type="number" id="gr_t2" placeholder="6"></div>
    </div>
    <button class="btn-calc" onclick="calcGrowthRate()">Calculate</button>
    <button class="btn-reset" onclick="renderGrowthRate(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcGrowthRate() {
  const N1=parseFloat(document.getElementById('gr_n1').value);
  const N2=parseFloat(document.getElementById('gr_n2').value);
  const t1=parseFloat(document.getElementById('gr_t1').value)||0;
  const t2=parseFloat(document.getElementById('gr_t2').value);
  if (!N1||!N2||!t2||N2<=N1) { showToast('Check inputs: N2 must be > N1','error'); return; }
  const mu = (Math.log(N2)-Math.log(N1))/(t2-t1);
  const td = Math.LN2/mu;
  addRecent('growthrate', `μ = ${mu.toFixed(3)} h⁻¹, td = ${td.toFixed(2)} h`);
  showResult('resultPanel', `
    ${mainResult('Doubling Time', td.toFixed(3), 'h')}
    ${multiResults([['Specific Growth Rate (μ)',mu.toFixed(4)+' h⁻¹'],['Doublings in period',((t2-t1)/td).toFixed(2)],['Fold change',(N2/N1).toFixed(2)+'×']])}
    ${steps(`μ = (ln N₂ - ln N₁) / (t₂ - t₁) = (ln ${N2} - ln ${N1}) / (${t2} - ${t1})`,`μ = ${mu.toFixed(4)} h⁻¹`,`td = ln(2) / μ = 0.693 / ${mu.toFixed(4)} = <code>${td.toFixed(3)} h</code>`)}
    ${exportBtn({'μ (h⁻¹)':mu.toFixed(4),'Doubling time (h)':td.toFixed(3),'N1':N1,'N2':N2,'t1 (h)':t1,'t2 (h)':t2})}
  `);
}

function renderMu(el) {
  el.innerHTML = calcBody(`
    <div class="calc-tabs">
      <div class="calc-tab active" onclick="switchTab(this,'mu_monod')">Monod Kinetics</div>
      <div class="calc-tab" onclick="switchTab(this,'mu_slope')">From Slope</div>
    </div>
    <div id="mu_monod">
      <div class="field-row">
        <div class="field"><label>μmax <span>(h⁻¹)</span></label><input type="number" id="mu_max" placeholder="0.9" step="0.01"></div>
        <div class="field"><label>Ks <span>(g/L)</span></label><input type="number" id="mu_ks" placeholder="0.15" step="0.01"></div>
      </div>
      <div class="field"><label>Substrate Conc. [S] <span>(g/L)</span></label><input type="number" id="mu_s" placeholder="5" step="0.1"></div>
    </div>
    <div id="mu_slope" style="display:none">
      <div class="field-row">
        <div class="field"><label>ln(X₁)</label><input type="number" id="mu_lx1" placeholder="e.g. -2.3" step="0.01"></div>
        <div class="field"><label>ln(X₂)</label><input type="number" id="mu_lx2" placeholder="e.g. 0.5" step="0.01"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>t₁ <span>(h)</span></label><input type="number" id="mu_st1" value="0"></div>
        <div class="field"><label>t₂ <span>(h)</span></label><input type="number" id="mu_st2" placeholder="5"></div>
      </div>
    </div>
    <button class="btn-calc" onclick="calcMu()">Calculate μ</button>
    <button class="btn-reset" onclick="renderMu(document.getElementById('calcBody'))">Reset</button>
  `);
}
function switchTab(tab, showId) {
  tab.closest('.form-card').querySelectorAll('.calc-tab').forEach(t=>t.classList.remove('active'));
  tab.classList.add('active');
  ['mu_monod','mu_slope'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display = id===showId?'block':'none';
  });
  tab.dataset.mode = showId;
}
function calcMu() {
  const activeTab = document.querySelector('.calc-tab.active');
  const mode = document.getElementById('mu_monod').style.display!=='none'?'monod':'slope';
  let mu;
  if (mode==='monod') {
    const mumax=parseFloat(document.getElementById('mu_max').value);
    const Ks=parseFloat(document.getElementById('mu_ks').value);
    const S=parseFloat(document.getElementById('mu_s').value);
    if (!mumax||!Ks||S===undefined||isNaN(S)) { showToast('Fill all fields','error'); return; }
    mu = mumax * S / (Ks + S);
    const pct = (mu/mumax*100).toFixed(1);
    addRecent('mu', `μ = ${mu.toFixed(4)} h⁻¹`);
    showResult('resultPanel', `
      ${mainResult('Specific Growth Rate (μ)', mu.toFixed(4), 'h⁻¹')}
      ${multiResults([['% of μmax',pct+'%'],['Saturation',S>=5*Ks?'Near-saturated':'Limiting']])}
      ${steps(`Monod: μ = μmax × [S] / (Ks + [S])`,`= ${mumax} × ${S} / (${Ks} + ${S})`,`= <code>${mu.toFixed(4)} h⁻¹</code> (${pct}% of μmax)`)}
      ${exportBtn({'μmax (h⁻¹)':mumax,'Ks (g/L)':Ks,'[S] (g/L)':S,'μ (h⁻¹)':mu.toFixed(4)})}
    `);
  } else {
    const lx1=parseFloat(document.getElementById('mu_lx1').value);
    const lx2=parseFloat(document.getElementById('mu_lx2').value);
    const t1=parseFloat(document.getElementById('mu_st1').value)||0;
    const t2=parseFloat(document.getElementById('mu_st2').value);
    if (isNaN(lx1)||isNaN(lx2)||!t2) { showToast('Fill all fields','error'); return; }
    mu = (lx2-lx1)/(t2-t1);
    const td = Math.LN2/mu;
    addRecent('mu', `μ = ${mu.toFixed(4)} h⁻¹`);
    showResult('resultPanel', `
      ${mainResult('Specific Growth Rate (μ)', mu.toFixed(4), 'h⁻¹')}
      ${multiResults([['Doubling time',td.toFixed(3)+' h'],['Slope',(lx2-lx1).toFixed(4)+' per '+(t2-t1)+' h']])}
      ${steps(`μ = slope of ln(X) vs time`,`= (${lx2} - ${lx1}) / (${t2} - ${t1}) = <code>${mu.toFixed(4)} h⁻¹</code>`,`Doubling time = ln(2)/μ = <code>${td.toFixed(3)} h</code>`)}
      ${exportBtn({'μ (h⁻¹)':mu.toFixed(4),'Doubling time (h)':td.toFixed(3)})}
    `);
  }
}

function renderBiomass(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>Initial Biomass X₀ <span>(g/L)</span></label><input type="number" id="bm_x0" placeholder="0.5" step="0.01"></div>
      <div class="field"><label>Final Biomass X₁ <span>(g/L)</span></label><input type="number" id="bm_x1" placeholder="8" step="0.01"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Substrate Consumed ΔS <span>(g/L)</span></label><input type="number" id="bm_ds" placeholder="20" step="0.1"></div>
      <div class="field"><label>Fermentation Time <span>(h)</span></label><input type="number" id="bm_t" placeholder="24"></div>
    </div>
    <button class="btn-calc" onclick="calcBiomass()">Calculate</button>
    <button class="btn-reset" onclick="renderBiomass(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcBiomass() {
  const x0=parseFloat(document.getElementById('bm_x0').value);
  const x1=parseFloat(document.getElementById('bm_x1').value);
  const ds=parseFloat(document.getElementById('bm_ds').value);
  const t=parseFloat(document.getElementById('bm_t').value);
  if (!x0||!x1||!ds||!t) { showToast('Fill all fields','error'); return; }
  const dx=x1-x0, yxs=dx/ds, qx=dx/t;
  addRecent('biomass', `Y(X/S) = ${yxs.toFixed(3)}`);
  showResult('resultPanel', `
    ${mainResult('Biomass Yield Y(X/S)', yxs.toFixed(4), 'g biomass/g substrate')}
    ${multiResults([['Biomass produced (ΔX)',dx.toFixed(3)+' g/L'],['Volumetric productivity (Qx)',qx.toFixed(3)+' g/L/h'],['Substrate consumed (ΔS)',ds+' g/L']])}
    ${steps(`ΔX = X₁ - X₀ = ${x1} - ${x0} = ${dx.toFixed(3)} g/L`,`Y(X/S) = ΔX / ΔS = ${dx.toFixed(3)} / ${ds} = <code>${yxs.toFixed(4)}</code>`,`Qx = ΔX / Δt = ${dx.toFixed(3)} / ${t} = <code>${qx.toFixed(3)} g/L/h</code>`)}
    ${exportBtn({'Y(X/S)':yxs.toFixed(4),'Qx (g/L/h)':qx.toFixed(3),'ΔX (g/L)':dx.toFixed(3)})}
  `);
}

function renderSubstrate(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>Specific Growth Rate μ <span>(h⁻¹)</span></label><input type="number" id="sub_mu" placeholder="0.5" step="0.01"></div>
      <div class="field"><label>Yield Y(X/S)</label><input type="number" id="sub_y" placeholder="0.45" step="0.01"></div>
    </div>
    <div class="field"><label>Biomass Concentration X <span>(g/L)</span></label><input type="number" id="sub_x" placeholder="5" step="0.1"></div>
    <button class="btn-calc" onclick="calcSubstrate()">Calculate</button>
    <button class="btn-reset" onclick="renderSubstrate(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcSubstrate() {
  const mu=parseFloat(document.getElementById('sub_mu').value);
  const y=parseFloat(document.getElementById('sub_y').value);
  const x=parseFloat(document.getElementById('sub_x').value);
  if (!mu||!y||!x) { showToast('Fill all fields','error'); return; }
  const qs=mu/y, qs_vol=qs*x;
  addRecent('substrate', `qs = ${qs.toFixed(3)} g/g/h`);
  showResult('resultPanel', `
    ${mainResult('Specific Uptake Rate (qs)', qs.toFixed(4), 'g substrate/g biomass/h')}
    ${multiResults([['Volumetric rate (Qs)',qs_vol.toFixed(4)+' g/L/h'],['Based on X',x+' g/L'],['μ used',mu+' h⁻¹']])}
    ${steps(`qs = μ / Y(X/S) = ${mu} / ${y} = <code>${qs.toFixed(4)}</code>`,`Qs = qs × X = ${qs.toFixed(4)} × ${x} = <code>${qs_vol.toFixed(4)} g/L/h</code>`)}
    ${exportBtn({'qs (g/g/h)':qs.toFixed(4),'Qs (g/L/h)':qs_vol.toFixed(4)})}
  `);
}

function renderMedia(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>Component Amount <span>(g or mL)</span></label><input type="number" id="med_amt" placeholder="10" step="0.1"></div>
      <div class="field"><label>Stock/Reference Volume <span>(L)</span></label><input type="number" id="med_sv" value="1" step="0.1"></div>
    </div>
    <div class="field"><label>Target Preparation Volume <span>(L)</span></label><input type="number" id="med_tv" placeholder="5" step="0.1"></div>
    <button class="btn-calc" onclick="calcMedia()">Calculate</button>
    <button class="btn-reset" onclick="renderMedia(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcMedia() {
  const amt=parseFloat(document.getElementById('med_amt').value);
  const sv=parseFloat(document.getElementById('med_sv').value)||1;
  const tv=parseFloat(document.getElementById('med_tv').value);
  if (!amt||!tv) { showToast('Fill all fields','error'); return; }
  const scaled = (amt/sv)*tv;
  addRecent('media', `Scale: ${sv} L → ${tv} L`);
  showResult('resultPanel', `
    ${mainResult('Scaled Amount', scaled.toFixed(4), 'g or mL')}
    ${multiResults([['Scale factor',(tv/sv).toFixed(2)+'×'],['Original amount',amt+' (per '+sv+' L)']])}
    ${steps(`Scale factor = Target / Stock = ${tv} / ${sv} = ${(tv/sv).toFixed(2)}×`,`Scaled = ${amt} × ${(tv/sv).toFixed(2)} = <code>${scaled.toFixed(4)}</code>`)}
    ${exportBtn({'Scaled amount':scaled.toFixed(4),'Scale factor':(tv/sv).toFixed(2)})}
  `);
}

function renderOD600(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>OD600 Reading</label><input type="number" id="od_val" placeholder="0.6" step="0.01"></div>
    <div class="field"><label>Organism</label>
      <select id="od_org">
        <option value="8e8">E. coli (~8×10⁸ cells/mL per OD)</option>
        <option value="3e7">S. cerevisiae (~3×10⁷ cells/mL per OD)</option>
        <option value="1e9">B. subtilis (~10⁹ cells/mL per OD)</option>
        <option value="custom">Custom factor</option>
      </select>
    </div>
    <div class="field" id="od_custom_field" style="display:none">
      <label>Custom Conversion Factor <span>(cells/mL per OD)</span></label>
      <input type="number" id="od_custom" placeholder="8e8">
    </div>
    <div class="field"><label>Dilution Factor <span>(if sample was diluted)</span></label><input type="number" id="od_df" value="1"></div>
    <button class="btn-calc" onclick="calcOD600()">Convert</button>
    <button class="btn-reset" onclick="renderOD600(document.getElementById('calcBody'))">Reset</button>
  `);
  document.getElementById('od_org').addEventListener('change', function() {
    document.getElementById('od_custom_field').style.display = this.value==='custom'?'block':'none';
  });
}
function calcOD600() {
  const od=parseFloat(document.getElementById('od_val').value);
  const df=parseFloat(document.getElementById('od_df').value)||1;
  const sel=document.getElementById('od_org').value;
  const factor = sel==='custom' ? parseFloat(document.getElementById('od_custom').value) : parseFloat(sel);
  if (!od||!factor) { showToast('Fill all fields','error'); return; }
  const cells = od * factor * df;
  addRecent('od600', `OD${od} → ${cells.toExponential(2)} cells/mL`);
  showResult('resultPanel', `
    ${mainResult('Cell Density', cells.toExponential(3), 'cells/mL')}
    ${multiResults([['Corrected OD',(od*df).toFixed(3)],['Factor used',factor.toExponential(1)+' cells/mL/OD'],['Growth phase',od<0.1?'Lag/Early log':od<0.5?'Mid log':od<1.5?'Late log':'Stationary']])}
    ${steps(`Cells/mL = OD600 × Dilution Factor × Conversion factor`,`= ${od} × ${df} × ${factor.toExponential(1)} = <code>${cells.toExponential(3)}</code>`)}
    ${exportBtn({'OD600':od,'Dilution factor':df,'Cells/mL':cells.toExponential(3)})}
  `);
}

// ─── PLANT TISSUE CULTURE ─────────────────────────────

function renderMS(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>Media Volume <span>(L)</span></label><input type="number" id="ms_vol" value="1" step="0.1"></div>
      <div class="field"><label>MS Strength</label>
        <select id="ms_str"><option value="1">Full MS (1×)</option><option value="0.5">Half MS (½×)</option><option value="0.25">Quarter MS (¼×)</option></select>
      </div>
    </div>
    <button class="btn-calc" onclick="calcMS()">Calculate Amounts</button>
    <button class="btn-reset" onclick="renderMS(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcMS() {
  const vol=parseFloat(document.getElementById('ms_vol').value)||1;
  const str=parseFloat(document.getElementById('ms_str').value)||1;
  const base = {
    'NH₄NO₃':1650,'KNO₃':1900,'CaCl₂·2H₂O':440,'MgSO₄·7H₂O':370,'KH₂PO₄':170,
    'KI':0.83,'H₃BO₃':6.2,'MnSO₄·4H₂O':22.3,'ZnSO₄·7H₂O':8.6,'Na₂MoO₄·2H₂O':0.25,
    'CuSO₄·5H₂O':0.025,'CoCl₂·6H₂O':0.025,'FeSO₄·7H₂O':27.8,'Na₂-EDTA':37.3
  };
  addRecent('ms', `${str===1?'Full':str===0.5?'Half':'Quarter'} MS × ${vol} L`);
  showResult('resultPanel', `
    <div class="result-main"><div class="result-label">Media</div><div class="result-value" style="font-size:1rem;">${vol} L of ${str===1?'Full':str===0.5?'½':' ¼'} MS</div></div>
    ${multiResults(Object.entries(base).map(([k,v])=>[k, fmtNum(v*str*vol/1000,4)+' g']))}
    ${steps(`Scale = Concentration × Strength × Volume`,`Multiply each salt amount by ${str} (strength) × ${vol} (L)`,`Dissolve macronutrients first, then micronutrients, then chelated iron. pH to 5.8 before autoclaving.`)}
    ${exportBtn({'Volume (L)':vol,'Strength':str,'NH4NO3 (g)':fmtNum(1650*str*vol/1000,4),'KNO3 (g)':fmtNum(1900*str*vol/1000,4)})}
  `);
}

function renderPGR(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>PGR / Hormone</label>
      <select id="pgr_type">
        <option>BAP (Benzylaminopurine)</option><option>Kinetin</option><option>IAA</option>
        <option>IBA</option><option>NAA</option><option>2,4-D</option><option>GA₃</option><option>Zeatin</option>
      </select>
    </div>
    <div class="field-row">
      <div class="field"><label>Stock Concentration <span>(mg/L)</span></label><input type="number" id="pgr_sc" placeholder="1000" step="0.1"></div>
      <div class="field"><label>Final Concentration <span>(mg/L)</span></label><input type="number" id="pgr_fc" placeholder="2" step="0.01"></div>
    </div>
    <div class="field"><label>Total Media Volume <span>(mL)</span></label><input type="number" id="pgr_vol" value="1000"></div>
    <button class="btn-calc" onclick="calcPGR()">Calculate Volume</button>
    <button class="btn-reset" onclick="renderPGR(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcPGR() {
  const sc=parseFloat(document.getElementById('pgr_sc').value);
  const fc=parseFloat(document.getElementById('pgr_fc').value);
  const vol=parseFloat(document.getElementById('pgr_vol').value)||1000;
  const pgr=document.getElementById('pgr_type').value;
  if (!sc||!fc) { showToast('Fill stock and final concentrations','error'); return; }
  const v1 = (fc*vol)/sc;
  addRecent('pgr', `${pgr}: ${v1.toFixed(3)} mL from ${sc} mg/L stock`);
  showResult('resultPanel', `
    ${mainResult('Stock Volume to Add', v1.toFixed(3), 'mL')}
    ${multiResults([['PGR',pgr],['Stock concentration',sc+' mg/L'],['Final concentration',fc+' mg/L'],['Media volume',vol+' mL']])}
    ${steps(`C₁V₁ = C₂V₂  →  V₁ = C₂V₂ / C₁`,`V₁ = (${fc} × ${vol}) / ${sc} = <code>${v1.toFixed(3)} mL</code>`,`Add ${v1.toFixed(3)} mL of ${sc} mg/L ${pgr} stock to media before autoclaving (or filter-sterilize heat-labile hormones).`)}
    ${exportBtn({'PGR':pgr,'Stock (mg/L)':sc,'Final (mg/L)':fc,'Volume to add (mL)':v1.toFixed(3)})}
  `);
}

function renderDilution(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>Stock Concentration (C₁)</label><input type="number" id="dil_c1" placeholder="100" step="0.001"></div>
      <div class="field"><label>Desired Concentration (C₂)</label><input type="number" id="dil_c2" placeholder="10" step="0.001"></div>
    </div>
    <div class="field"><label>Final Volume (V₂) <span>(mL)</span></label><input type="number" id="dil_v2" placeholder="100"></div>
    <button class="btn-calc" onclick="calcDilution()">Calculate V₁</button>
    <button class="btn-reset" onclick="renderDilution(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcDilution() {
  const c1=parseFloat(document.getElementById('dil_c1').value);
  const c2=parseFloat(document.getElementById('dil_c2').value);
  const v2=parseFloat(document.getElementById('dil_v2').value);
  if (!c1||!c2||!v2||c2>c1) { showToast('Ensure C2 < C1 and fill all fields','error'); return; }
  const v1=(c2*v2)/c1, diluent=v2-v1, df=c1/c2;
  addRecent('dilution', `${df.toFixed(1)}× dilution → ${v1.toFixed(2)} mL stock`);
  showResult('resultPanel', `
    ${mainResult('Stock Volume (V₁)', v1.toFixed(4), 'mL')}
    ${multiResults([['Diluent to add',diluent.toFixed(4)+' mL'],['Dilution factor',df.toFixed(2)+'×']])}
    ${steps(`C₁V₁ = C₂V₂  →  V₁ = C₂V₂ / C₁`,`V₁ = (${c2} × ${v2}) / ${c1} = <code>${v1.toFixed(4)} mL</code>`,`Add ${v1.toFixed(4)} mL stock to ${diluent.toFixed(4)} mL diluent to reach final ${v2} mL.`)}
    ${exportBtn({'V1 (mL)':v1.toFixed(4),'Diluent (mL)':diluent.toFixed(4),'Dilution factor':df.toFixed(2)})}
  `);
}

function renderMultiplication(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>Initial Explant Number</label><input type="number" id="mul_n0" placeholder="10" min="1"></div>
      <div class="field"><label>Multiplication Rate per Cycle</label><input type="number" id="mul_rate" placeholder="4" step="0.1"></div>
    </div>
    <div class="field"><label>Number of Subculture Cycles</label><input type="number" id="mul_n" placeholder="4" min="1" max="20"></div>
    <button class="btn-calc" onclick="calcMultiplication()">Project Growth</button>
    <button class="btn-reset" onclick="renderMultiplication(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcMultiplication() {
  const n0=parseFloat(document.getElementById('mul_n0').value)||10;
  const rate=parseFloat(document.getElementById('mul_rate').value)||4;
  const n=parseInt(document.getElementById('mul_n').value)||4;
  const total = n0*Math.pow(rate,n);
  addRecent('multiplication', `${n0} × ${rate}^${n} = ${Math.round(total).toLocaleString()}`);
  let tableRows = [];
  let curr=n0;
  for (let i=1;i<=n;i++) { curr*=rate; tableRows.push([`Cycle ${i}`,Math.round(curr).toLocaleString()]); }
  showResult('resultPanel', `
    ${mainResult('Total Plantlets after '+n+' cycles', Math.round(total).toLocaleString(), '')}
    ${multiResults(tableRows)}
    ${steps(`Total = N₀ × Rate^n = ${n0} × ${rate}^${n}`,`= ${n0} × ${Math.pow(rate,n)} = <code>${Math.round(total).toLocaleString()}</code>`)}
    ${exportBtn({'Initial':n0,'Rate':rate,'Cycles':n,'Total':Math.round(total)})}
  `);
}

function renderAgarSugar(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>Media Volume <span>(mL)</span></label><input type="number" id="as_vol" value="1000" step="100"></div>
    <div class="field-row">
      <div class="field"><label>Agar Concentration <span>(% w/v)</span></label><input type="number" id="as_ag" value="0.8" step="0.1"></div>
      <div class="field"><label>Sucrose Concentration <span>(% w/v)</span></label><input type="number" id="as_su" value="3" step="0.5"></div>
    </div>
    <button class="btn-calc" onclick="calcAgarSugar()">Calculate</button>
    <button class="btn-reset" onclick="renderAgarSugar(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcAgarSugar() {
  const vol=parseFloat(document.getElementById('as_vol').value)||1000;
  const ag=parseFloat(document.getElementById('as_ag').value)||0.8;
  const su=parseFloat(document.getElementById('as_su').value)||3;
  const agar_g=(ag/100)*vol, sucrose_g=(su/100)*vol;
  addRecent('agarsugar', `Agar: ${agar_g.toFixed(1)} g, Sucrose: ${sucrose_g.toFixed(1)} g`);
  showResult('resultPanel', `
    ${mainResult('Agar Required', agar_g.toFixed(2), 'g')}
    ${multiResults([['Sucrose Required',sucrose_g.toFixed(2)+' g'],['Total volume',vol+' mL'],['Agar %',ag+'% (w/v)'],['Sucrose %',su+'% (w/v)']])}
    ${steps(`Agar = ${ag}% × ${vol} mL / 100 = <code>${agar_g.toFixed(2)} g</code>`,`Sucrose = ${su}% × ${vol} mL / 100 = <code>${sucrose_g.toFixed(2)} g</code>`,`Dissolve sucrose first, add agar, autoclave at 121°C/15 psi for 20 min.`)}
    ${exportBtn({'Agar (g)':agar_g.toFixed(2),'Sucrose (g)':sucrose_g.toFixed(2),'Volume (mL)':vol})}
  `);
}

function renderSurvival(el) {
  el.innerHTML = calcBody(`
    <div class="field-row">
      <div class="field"><label>Total Explants Inoculated</label><input type="number" id="sv_total" placeholder="50" min="1"></div>
      <div class="field"><label>Surviving Explants</label><input type="number" id="sv_alive" placeholder="38" min="0"></div>
    </div>
    <div class="field"><label>Observation Period <span>(days)</span></label><input type="number" id="sv_days" placeholder="28"></div>
    <button class="btn-calc" onclick="calcSurvival()">Calculate</button>
    <button class="btn-reset" onclick="renderSurvival(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcSurvival() {
  const total=parseFloat(document.getElementById('sv_total').value);
  const alive=parseFloat(document.getElementById('sv_alive').value);
  const days=document.getElementById('sv_days').value;
  if (!total||alive===undefined||isNaN(alive)||alive>total) { showToast('Check inputs','error'); return; }
  const pct=(alive/total)*100, dead=total-alive;
  addRecent('survival', `${pct.toFixed(1)}% survival`);
  showResult('resultPanel', `
    ${mainResult('Survival Percentage', pct.toFixed(2), '%')}
    ${multiResults([['Surviving',alive],['Dead/contaminated',dead],['Loss rate',((dead/total)*100).toFixed(2)+'%'],['Observation',(days||'–')+' days']])}
    ${steps(`Survival % = (Surviving / Total) × 100`,`= (${alive} / ${total}) × 100 = <code>${pct.toFixed(2)}%</code>`)}
    ${exportBtn({'Total':total,'Surviving':alive,'Survival%':pct.toFixed(2),'Days':days||'–'})}
  `);
}

// ─── MICROBIOLOGY & GENERAL LAB ───────────────────────

function renderMolarity(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>What to Calculate</label>
      <select id="mol_calc">
        <option value="molarity">Molarity (M) from mass</option>
        <option value="mass">Mass from molarity</option>
        <option value="normality">Normality (N)</option>
      </select>
    </div>
    <div class="field-row">
      <div class="field"><label>Molecular Weight <span>(g/mol)</span></label><input type="number" id="mol_mw" placeholder="58.44" step="0.001"></div>
      <div class="field"><label>Volume <span>(L)</span></label><input type="number" id="mol_vol" placeholder="1" step="0.001"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Mass <span>(g)</span></label><input type="number" id="mol_mass" placeholder="5.85"></div>
      <div class="field"><label>n-factor (for normality)</label><input type="number" id="mol_nf" value="1" min="1"></div>
    </div>
    <button class="btn-calc" onclick="calcMolarity()">Calculate</button>
    <button class="btn-reset" onclick="renderMolarity(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcMolarity() {
  const mode=document.getElementById('mol_calc').value;
  const mw=parseFloat(document.getElementById('mol_mw').value);
  const vol=parseFloat(document.getElementById('mol_vol').value);
  const mass=parseFloat(document.getElementById('mol_mass').value);
  const nf=parseFloat(document.getElementById('mol_nf').value)||1;
  if (!mw||!vol) { showToast('Enter MW and volume','error'); return; }
  if (mode==='molarity'||mode==='normality') {
    if (!mass) { showToast('Enter mass','error'); return; }
    const M=mass/(mw*vol), N=M*nf;
    addRecent('molarity', `M = ${M.toFixed(4)} mol/L`);
    showResult('resultPanel', `
      ${mainResult(mode==='normality'?'Normality (N)':'Molarity (M)', mode==='normality'?N.toFixed(4):M.toFixed(4), mode==='normality'?'N':'mol/L')}
      ${multiResults([['Molarity',M.toFixed(4)+' M'],['Normality',N.toFixed(4)+' N'],['Moles',(mass/mw).toFixed(4)+' mol']])}
      ${steps(`n = mass/MW = ${mass}/${mw} = ${(mass/mw).toFixed(4)} mol`,`M = n/V = ${(mass/mw).toFixed(4)}/${vol} = <code>${M.toFixed(4)} M</code>`,`N = M × n-factor = ${M.toFixed(4)} × ${nf} = <code>${N.toFixed(4)} N</code>`)}
      ${exportBtn({'M (mol/L)':M.toFixed(4),'N':N.toFixed(4),'Mass (g)':mass,'MW':mw,'Volume (L)':vol})}
    `);
  } else {
    const M=parseFloat(document.getElementById('mol_mass').value)||1;
    const m=M*mw*vol;
    addRecent('molarity', `m = ${m.toFixed(3)} g for ${M} M`);
    showResult('resultPanel', `
      ${mainResult('Mass Required', m.toFixed(4), 'g')}
      ${steps(`m = M × MW × V = ${M} × ${mw} × ${vol} = <code>${m.toFixed(4)} g</code>`)}
      ${exportBtn({'Mass (g)':m.toFixed(4),'Molarity (M)':M,'MW':mw,'Volume (L)':vol})}
    `);
  }
}

function renderSerialDilution(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>Initial Concentration (C₀)</label><input type="number" id="sd_c0" placeholder="1e6" step="any"></div>
    <div class="field-row">
      <div class="field"><label>Dilution Factor per Step</label><input type="number" id="sd_df" value="10" min="2"></div>
      <div class="field"><label>Number of Steps</label><input type="number" id="sd_n" value="6" min="1" max="12"></div>
    </div>
    <button class="btn-calc" onclick="calcSerialDilution()">Calculate Series</button>
    <button class="btn-reset" onclick="renderSerialDilution(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcSerialDilution() {
  const c0=parseFloat(document.getElementById('sd_c0').value);
  const df=parseFloat(document.getElementById('sd_df').value)||10;
  const n=parseInt(document.getElementById('sd_n').value)||6;
  if (!c0) { showToast('Enter initial concentration','error'); return; }
  let rows=[['Original (C₀)',c0.toExponential(2)]];
  for (let i=1;i<=n;i++) rows.push([`10⁻${i} (step ${i})`,(c0/Math.pow(df,i)).toExponential(2)]);
  addRecent('serialdilution', `${n} steps, ÷${df} each`);
  showResult('resultPanel', `
    ${mainResult('Final Concentration', (c0/Math.pow(df,n)).toExponential(3), '')}
    ${multiResults(rows)}
    ${steps(`Each step divides by dilution factor (${df})`,`Step n: Cn = C₀ / DF^n`,`Final: C${n} = ${c0} / ${df}^${n} = ${(c0/Math.pow(df,n)).toExponential(3)}`)}
    ${exportBtn({'C0':c0,'Dilution factor':df,'Steps':n,'Final Cn':(c0/Math.pow(df,n)).toExponential(3)})}
  `);
}

function renderBuffer(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>Buffer System</label>
      <select id="buf_sys">
        <option value="6.95">Phosphate (pKa 6.95 / 7.20)</option>
        <option value="8.06">Tris-HCl (pKa 8.06)</option>
        <option value="7.55">HEPES (pKa 7.55)</option>
        <option value="4.76">Acetate (pKa 4.76)</option>
        <option value="6.40">Citrate (pKa 6.40)</option>
        <option value="custom">Custom pKa</option>
      </select>
    </div>
    <div class="field" id="buf_custom_f" style="display:none">
      <label>Custom pKa</label><input type="number" id="buf_pka_c" placeholder="7.0" step="0.01">
    </div>
    <div class="field-row">
      <div class="field"><label>Desired pH</label><input type="number" id="buf_ph" placeholder="7.4" step="0.01"></div>
      <div class="field"><label>Total Buffer Conc. <span>(mM)</span></label><input type="number" id="buf_conc" value="100"></div>
    </div>
    <div class="field"><label>Final Volume <span>(mL)</span></label><input type="number" id="buf_vol" value="100"></div>
    <button class="btn-calc" onclick="calcBuffer()">Calculate Buffer</button>
    <button class="btn-reset" onclick="renderBuffer(document.getElementById('calcBody'))">Reset</button>
  `);
  document.getElementById('buf_sys').addEventListener('change', function() {
    document.getElementById('buf_custom_f').style.display = this.value==='custom'?'block':'none';
  });
}
function calcBuffer() {
  const sel=document.getElementById('buf_sys').value;
  const pKa = sel==='custom' ? parseFloat(document.getElementById('buf_pka_c').value) : parseFloat(sel);
  const pH=parseFloat(document.getElementById('buf_ph').value);
  const conc=parseFloat(document.getElementById('buf_conc').value)||100;
  const vol=parseFloat(document.getElementById('buf_vol').value)||100;
  if (!pKa||!pH) { showToast('Fill all fields','error'); return; }
  const ratio=Math.pow(10, pH-pKa);
  const base_frac=ratio/(1+ratio), acid_frac=1/(1+ratio);
  const base_mM=conc*base_frac, acid_mM=conc*acid_frac;
  addRecent('buffer', `pH ${pH} buffer, ratio ${ratio.toFixed(2)}`);
  showResult('resultPanel', `
    ${mainResult('[A⁻] / [HA] Ratio', ratio.toFixed(4), '')}
    ${multiResults([['Base form [A⁻]',base_mM.toFixed(2)+' mM ('+((base_frac*100).toFixed(1))+'%)'],['Acid form [HA]',acid_mM.toFixed(2)+' mM ('+((acid_frac*100).toFixed(1))+'%)'],['pKa used',pKa],['Buffer capacity',Math.abs(pH-pKa)<1?'Good (pH within 1 of pKa)':'Reduced (pH >1 away from pKa)']])}
    ${steps(`Henderson-Hasselbalch: pH = pKa + log([A⁻]/[HA])`,`[A⁻]/[HA] = 10^(pH - pKa) = 10^(${pH} - ${pKa}) = ${ratio.toFixed(4)}`,`Base: ${base_mM.toFixed(2)} mM | Acid: ${acid_mM.toFixed(2)} mM in ${vol} mL`)}
    ${exportBtn({'pH':pH,'pKa':pKa,'[A-]/[HA]':ratio.toFixed(4),'Base (mM)':base_mM.toFixed(2),'Acid (mM)':acid_mM.toFixed(2)})}
  `);
}

function renderPct(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>Solution Type</label>
      <select id="pct_type">
        <option value="wv">% (w/v) — g per 100 mL</option>
        <option value="vv">% (v/v) — mL per 100 mL</option>
        <option value="ww">% (w/w) — g per 100 g</option>
      </select>
    </div>
    <div class="field"><label>What to find</label>
      <select id="pct_find">
        <option value="pct">Calculate %</option>
        <option value="mass">Calculate mass/volume of solute</option>
        <option value="vol">Calculate total volume needed</option>
      </select>
    </div>
    <div class="field-row">
      <div class="field"><label>Mass/Volume of Solute</label><input type="number" id="pct_solute" placeholder="5" step="0.001"></div>
      <div class="field"><label>Total Volume/Mass of Solution</label><input type="number" id="pct_total" placeholder="100" step="0.1"></div>
    </div>
    <div class="field"><label>Percentage <span>(%)</span></label><input type="number" id="pct_pct" placeholder="5" step="0.01"></div>
    <button class="btn-calc" onclick="calcPct()">Calculate</button>
    <button class="btn-reset" onclick="renderPct(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcPct() {
  const type=document.getElementById('pct_type').value;
  const find=document.getElementById('pct_find').value;
  const solute=parseFloat(document.getElementById('pct_solute').value);
  const total=parseFloat(document.getElementById('pct_total').value);
  const pct_val=parseFloat(document.getElementById('pct_pct').value);
  const unit=type==='wv'?['g','mL']:type==='vv'?['mL','mL']:['g','g'];
  let result, label;
  if (find==='pct') {
    if (!solute||!total) { showToast('Enter solute and total','error'); return; }
    result=(solute/total)*100; label='Percentage (%)';
  } else if (find==='mass') {
    if (!pct_val||!total) { showToast('Enter % and total','error'); return; }
    result=(pct_val/100)*total; label=`Solute required (${unit[0]})`;
  } else {
    if (!pct_val||!solute) { showToast('Enter % and solute','error'); return; }
    result=(solute/pct_val)*100; label=`Total volume (${unit[1]})`;
  }
  addRecent('pct', `${result.toFixed(3)} ${label}`);
  showResult('resultPanel', `
    ${mainResult(label, result.toFixed(4), '')}
    ${steps(`Formula (${type}): % = (${unit[0]} solute / ${unit[1]} solution) × 100`,`Result: <code>${result.toFixed(4)}</code>`)}
    ${exportBtn({[label]:result.toFixed(4),'Type':type})}
  `);
}

function renderCFU(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>Colony Count</label><input type="number" id="cfu_count" placeholder="150" min="0"></div>
    <div class="field-row">
      <div class="field"><label>Dilution Factor <span>(e.g. 1e-6)</span></label><input type="number" id="cfu_df" placeholder="0.000001" step="any"></div>
      <div class="field"><label>Volume Plated <span>(mL)</span></label><input type="number" id="cfu_vol" value="0.1" step="0.01"></div>
    </div>
    <button class="btn-calc" onclick="calcCFU()">Calculate CFU</button>
    <button class="btn-reset" onclick="renderCFU(document.getElementById('calcBody'))">Reset</button>
  `);
}
function calcCFU() {
  const count=parseFloat(document.getElementById('cfu_count').value);
  const df=parseFloat(document.getElementById('cfu_df').value);
  const vol=parseFloat(document.getElementById('cfu_vol').value)||0.1;
  if (!count||!df) { showToast('Fill all fields','error'); return; }
  const cfu=count/(df*vol);
  addRecent('cfu', `${cfu.toExponential(2)} CFU/mL`);
  showResult('resultPanel', `
    ${mainResult('CFU/mL', cfu.toExponential(3), 'CFU/mL')}
    ${multiResults([['Colony count',count],['Dilution factor',df.toExponential(0)],['Volume plated',vol+' mL'],['CFU/g (if applicable)',cfu.toExponential(3)]])}
    ${steps(`CFU/mL = Colonies / (Dilution factor × Volume plated)`,`= ${count} / (${df.toExponential(1)} × ${vol})`,`= <code>${cfu.toExponential(3)} CFU/mL</code>`)}
    ${exportBtn({'Colonies':count,'Dilution factor':df,'Volume (mL)':vol,'CFU/mL':cfu.toExponential(3)})}
  `);
}

function renderRPMRCF(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>Rotor Radius <span>(mm from center to sample)</span></label><input type="number" id="rf_r" placeholder="100" step="1"></div>
    <div class="calc-tabs" style="margin-top:0.5rem;">
      <div class="calc-tab active" onclick="rfMode=1;this.parentElement.querySelectorAll('.calc-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active');">RPM → RCF</div>
      <div class="calc-tab" onclick="rfMode=2;this.parentElement.querySelectorAll('.calc-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active');">RCF → RPM</div>
    </div>
    <div class="field" style="margin-top:0.75rem;"><label id="rf_inlabel">RPM</label><input type="number" id="rf_in" placeholder="3000"></div>
    <button class="btn-calc" onclick="calcRPMRCF()">Convert</button>
    <button class="btn-reset" onclick="renderRPMRCF(document.getElementById('calcBody'))">Reset</button>
  `);
  window.rfMode = 1;
  document.querySelectorAll('.calc-tab').forEach(t => {
    t.addEventListener('click', function() {
      document.getElementById('rf_inlabel').textContent = rfMode===1 ? 'RPM' : 'RCF (×g)';
      document.getElementById('rf_in').placeholder = rfMode===1 ? '3000' : '1000';
    });
  });
}
function calcRPMRCF() {
  const r=parseFloat(document.getElementById('rf_r').value);
  const val=parseFloat(document.getElementById('rf_in').value);
  if (!r||!val) { showToast('Enter radius and value','error'); return; }
  let result, label, resultLabel;
  if (rfMode===1||rfMode===undefined) {
    result = 1.118e-5 * r * val * val;
    label='RCF (×g)'; resultLabel='RPM → RCF';
  } else {
    result = Math.sqrt(val/(1.118e-5*r));
    label='RPM'; resultLabel='RCF → RPM';
  }
  addRecent('rpmrcf', `${label}: ${result.toFixed(1)}`);
  showResult('resultPanel', `
    ${mainResult(label, result.toFixed(1), label==='RCF (×g)'?'×g':'rpm')}
    ${steps(`Formula: RCF = 1.118×10⁻⁵ × r × N²`,`r = ${r} mm, ${rfMode===1?'N = '+val+' RPM':'RCF = '+val+' ×g'}`,`Result: <code>${result.toFixed(1)} ${label}</code>`)}
    ${exportBtn({'Radius (mm)':r,[rfMode===1?'RPM':'RCF']:val,[label]:result.toFixed(1)})}
  `);
}

function renderPH(el) {
  el.innerHTML = calcBody(`
    <div class="field"><label>Calculate from</label>
      <select id="ph_from">
        <option value="h">H⁺ concentration [H⁺] (mol/L)</option>
        <option value="oh">OH⁻ concentration [OH⁻] (mol/L)</option>
        <option value="poh">pOH value</option>
        <option value="ka">Weak acid Ka + concentration</option>
      </select>
    </div>
    <div class="field"><label id="ph_inlabel">H⁺ Concentration <span>(mol/L)</span></label>
      <input type="number" id="ph_in" placeholder="1e-7" step="any">
    </div>
    <div class="field" id="ph_c_field" style="display:none">
      <label>Acid Concentration <span>(mol/L)</span></label><input type="number" id="ph_c" placeholder="0.1" step="0.001">
    </div>
    <button class="btn-calc" onclick="calcPH()">Calculate pH</button>
    <button class="btn-reset" onclick="renderPH(document.getElementById('calcBody'))">Reset</button>
  `);
  document.getElementById('ph_from').addEventListener('change', function() {
    const labs = {h:'H⁺ Concentration (mol/L)',oh:'OH⁻ Concentration (mol/L)',poh:'pOH value',ka:'Ka value'};
    document.getElementById('ph_inlabel').textContent = labs[this.value];
    document.getElementById('ph_c_field').style.display = this.value==='ka'?'block':'none';
  });
}
function calcPH() {
  const from=document.getElementById('ph_from').value;
  const val=parseFloat(document.getElementById('ph_in').value);
  if (!val||isNaN(val)) { showToast('Enter a value','error'); return; }
  let pH, pOH, extras=[];
  if (from==='h') { pH=-Math.log10(val); pOH=14-pH; }
  else if (from==='oh') { pOH=-Math.log10(val); pH=14-pOH; }
  else if (from==='poh') { pOH=val; pH=14-pOH; }
  else {
    const C=parseFloat(document.getElementById('ph_c').value);
    if (!C) { showToast('Enter acid concentration','error'); return; }
    const h=Math.sqrt(val*C); pH=-Math.log10(h); pOH=14-pH;
    extras.push(['H⁺ from weak acid',h.toExponential(3)+' mol/L']);
  }
  addRecent('ph', `pH = ${pH.toFixed(3)}`);
  showResult('resultPanel', `
    ${mainResult('pH', pH.toFixed(4), '')}
    ${multiResults([['pOH',pOH.toFixed(4)],['[H⁺]',Math.pow(10,-pH).toExponential(3)+' mol/L'],['[OH⁻]',Math.pow(10,-pOH).toExponential(3)+' mol/L'],['Character',pH<7?'Acidic':pH===7?'Neutral':'Basic'],...extras])}
    ${steps(from==='h'?`pH = -log[H⁺] = -log(${val}) = <code>${pH.toFixed(4)}</code>`:from==='oh'?`pOH = -log[OH⁻] = ${pOH.toFixed(4)}, pH = 14 - pOH = <code>${pH.toFixed(4)}</code>`:from==='poh'?`pH = 14 - pOH = 14 - ${val} = <code>${pH.toFixed(4)}</code>`:`pH ≈ ½(pKa - log C) for weak acid`)}
    ${exportBtn({'pH':pH.toFixed(4),'pOH':pOH.toFixed(4)})}
  `);
}

function renderUnitConv(el) {
  el.innerHTML = calcBody(`
    <div class="calc-tabs">
      <div class="calc-tab active" id="uc_mass_tab" onclick="ucSwitch('mass')">Mass</div>
      <div class="calc-tab" id="uc_vol_tab" onclick="ucSwitch('vol')">Volume</div>
      <div class="calc-tab" id="uc_temp_tab" onclick="ucSwitch('temp')">Temperature</div>
    </div>
    <div id="uc_mass">
      <div class="field"><label>Value</label><input type="number" id="uc_val" placeholder="1" step="any"></div>
      <div class="field-row">
        <div class="field"><label>From</label><select id="uc_from_m"><option value="kg">kg</option><option value="g" selected>g</option><option value="mg">mg</option><option value="ug">μg</option><option value="ng">ng</option><option value="pg">pg</option></select></div>
        <div class="field"><label>To</label><select id="uc_to_m"><option value="kg">kg</option><option value="g">g</option><option value="mg">mg</option><option value="ug" selected>μg</option><option value="ng">ng</option><option value="pg">pg</option></select></div>
      </div>
    </div>
    <div id="uc_vol" style="display:none">
      <div class="field"><label>Value</label><input type="number" id="uc_val_v" placeholder="1" step="any"></div>
      <div class="field-row">
        <div class="field"><label>From</label><select id="uc_from_v"><option value="1">L</option><option value="0.001" selected>mL</option><option value="1e-6">μL</option><option value="1e-9">nL</option></select></div>
        <div class="field"><label>To</label><select id="uc_to_v"><option value="1">L</option><option value="0.001">mL</option><option value="1e-6" selected>μL</option><option value="1e-9">nL</option></select></div>
      </div>
    </div>
    <div id="uc_temp" style="display:none">
      <div class="field"><label>Temperature Value</label><input type="number" id="uc_val_t" placeholder="25" step="0.1"></div>
      <div class="field-row">
        <div class="field"><label>From</label><select id="uc_from_t"><option value="C" selected>°C</option><option value="F">°F</option><option value="K">K</option></select></div>
        <div class="field"><label>To</label><select id="uc_to_t"><option value="C">°C</option><option value="F" selected>°F</option><option value="K">K</option></select></div>
      </div>
    </div>
    <button class="btn-calc" onclick="calcUnitConv()">Convert</button>
    <button class="btn-reset" onclick="renderUnitConv(document.getElementById('calcBody'))">Reset</button>
  `);
  window.ucMode = 'mass';
}
function ucSwitch(mode) {
  window.ucMode = mode;
  ['mass','vol','temp'].forEach(m => {
    document.getElementById('uc_'+m).style.display = m===mode?'block':'none';
    document.getElementById('uc_'+m+'_tab').classList.toggle('active', m===mode);
  });
}
function calcUnitConv() {
  const mode=window.ucMode||'mass';
  const massF={kg:1e3,g:1,mg:1e-3,ug:1e-6,ng:1e-9,pg:1e-12};
  if (mode==='mass') {
    const v=parseFloat(document.getElementById('uc_val').value);
    const fm=document.getElementById('uc_from_m').value, to=document.getElementById('uc_to_m').value;
    if (!v&&v!==0) { showToast('Enter value','error'); return; }
    const result=(v*massF[fm])/massF[to];
    addRecent('unitconv', `${v} ${fm} = ${fmtNum(result)} ${to}`);
    showResult('resultPanel', `${mainResult('Result', fmtNum(result), to)}${steps(`${v} ${fm} × (${massF[fm]} g) / (${massF[to]} g) = <code>${fmtNum(result)} ${to}</code>`)}${exportBtn({'Value':v,'From':fm,'To':to,'Result':fmtNum(result)})}`);
  } else if (mode==='vol') {
    const v=parseFloat(document.getElementById('uc_val_v').value);
    const fm=parseFloat(document.getElementById('uc_from_v').value), to=parseFloat(document.getElementById('uc_to_v').value);
    if (!v&&v!==0) { showToast('Enter value','error'); return; }
    const result=(v*fm)/to;
    addRecent('unitconv', `Volume conversion: ${fmtNum(result)}`);
    showResult('resultPanel', `${mainResult('Result', fmtNum(result), 'target unit')}${steps(`Convert to L: ${v} × ${fm} = ${(v*fm).toExponential(3)} L`,`Convert to target: ${(v*fm).toExponential(3)} / ${to} = <code>${fmtNum(result)}</code>`)}${exportBtn({'Result':fmtNum(result)})}`);
  } else {
    const v=parseFloat(document.getElementById('uc_val_t').value);
    const fm=document.getElementById('uc_from_t').value, to=document.getElementById('uc_to_t').value;
    if (isNaN(v)) { showToast('Enter value','error'); return; }
    let celsius;
    if (fm==='C') celsius=v; else if (fm==='F') celsius=(v-32)*5/9; else celsius=v-273.15;
    let result;
    if (to==='C') result=celsius; else if (to==='F') result=celsius*9/5+32; else result=celsius+273.15;
    addRecent('unitconv', `${v}°${fm} = ${result.toFixed(2)}°${to}`);
    showResult('resultPanel', `${mainResult('Result', result.toFixed(4), '°'+to)}${steps(`Convert ${v} ${fm} to Celsius first`,`°C = ${celsius.toFixed(4)}`,`Convert to ${to}: <code>${result.toFixed(4)}</code>`)}${exportBtn({'Input':v+'°'+fm,'Result':result.toFixed(4)+'°'+to})}`);
  }
}

// ─── INIT ─────────────────────────────────────────────
function initApp() {
  const savedFs = localStorage.getItem('bionova_fs') || '1';
  setFontSize(savedFs);

  document.getElementById('hamburger').addEventListener('click', toggleSidebarMobile);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  document.querySelectorAll('.fs-btn').forEach(btn => {
    btn.addEventListener('click', () => setFontSize(btn.dataset.fs));
  });

  document.querySelectorAll('.ref-card').forEach(card => {
    card.addEventListener('click', () => copyRefCard(card));
  });

  const refSearch = document.getElementById('refSearch');
  if (refSearch) refSearch.addEventListener('input', e => filterRefs(e.target.value));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeSidebar();
      closeModal();
      searchResults.classList.remove('open');
    }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  document.getElementById('modalBackdrop').addEventListener('click', e => {
    if (e.target.id === 'modalBackdrop') closeModal();
  });

  if (!localStorage.getItem('bionova_welcome_seen')) {
    setTimeout(() => {
      openModal('welcome');
      localStorage.setItem('bionova_welcome_seen', '1');
    }, 600);
  }

  window.addEventListener('hashchange', handleHashRoute);

  if (location.hash.replace('#', '') && CALCS[location.hash.replace('#', '')]) {
    handleHashRoute();
  } else {
    showView('home');
  }
  renderRecent();
  renderFavorites();
}

initApp();
