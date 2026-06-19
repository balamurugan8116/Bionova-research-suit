
# BioNova — Research Calculation Suite

BioNova is a comprehensive research calculation suite for biotechnology and life-science applications. It provides formula-driven, module-based calculators and helpers designed for students, researchers, and lab professionals working in molecular biology, bioprocess engineering, microbiology, and plant tissue culture.

## Purpose

Provide accurate, documented calculation tools organized into specialized modules so common laboratory workflows are faster, less error-prone, and reproducible. Each calculator includes formula references, input validation, and an optional step-by-step breakdown of results.

## Key Modules

### Molecular Biology

- DNA Melting Temperature (Tm) Calculator
- DNA/RNA Molecular Weight Calculator
- GC Content Analyzer
- PCR Master Mix Calculator
- DNA Copy Number Calculator
- Restriction Digest Calculator
- Agarose Gel Preparation Calculator

### Bioprocess Engineering

- Cell Growth Rate and Doubling Time
- Specific Growth Rate (μ) Calculator
- Biomass Yield and Productivity Calculator
- Substrate Consumption Rate
- Media Preparation Calculator
- Optical Density (OD600) Conversion

### Plant Tissue Culture

- MS Media Preparation Calculator
- Plant Growth Regulator Concentration Calculator
- Stock Solution and Dilution Calculator
- Explant Multiplication Rate Calculator
- Agar and Sucrose Requirement Calculator
- Survival Percentage Calculator

### Microbiology & General Laboratory

- Molarity and Normality Calculator
- Serial Dilution Calculator
- Buffer Preparation Calculator
- Percentage Solution Calculator
- Colony Forming Unit (CFU) Calculator
- RPM ↔ RCF Converter
- pH Calculator
- Unit Conversion Tools

## Analytical Features

- Formula library with scientific explanations
- Step-by-step calculation breakdown
- Search functionality for formulas and calculators
- Scientific notation support
- Input validation and error handling
- Save recent calculations and export results
- Reference section for commonly used equations and constants

## Files

- `bionova.html` — Main single-file front-end entry point that loads UI and modules.
- `script.js` — Core JavaScript; contains calculator logic and module wiring.
- `style.css` — Project styles and responsive layout.
- `assets/` — Images, data files, and optional module scripts.

## Rebuild / Run the Project (using `bionova.html`)

This is a static front-end project. "Rebuild" here means edit or extend the HTML/JS modules and then serve the files locally to test.

1. Open `bionova.html` in a browser for a quick preview (double-click the file).
2. For reliable testing (avoid CORS and enable module imports), serve the folder with a local static server. Example commands:

```powershell
# From the project root on Windows (PowerShell)
# Python 3
python -m http.server 8000

# or (Node.js)
npx http-server -c-1  # installs and runs http-server temporarily
```

Then open http://localhost:8000/bionova.html in your browser.

### Extending or Rebuilding Modules

- Add new calculator modules under `assets/modules/` (create folder) and import them from `script.js` or dynamically load from `bionova.html`.
- Keep UI markup in `bionova.html` and put calculation logic in separate JS modules for testability.
- If you add dependencies, use a simple bundler (esbuild/webpack) or include compiled bundles in `assets/`.

## Development Notes

- Edit `script.js` and `bionova.html` to add or modify calculators.
- Use the browser console to view validation messages and debug calculations.
- Keep experimental data and large resources in `assets/` and reference them with relative paths.

## Contributing

- Open issues for bugs or feature requests.
- Create PRs for new calculators with formula references and unit tests where appropriate.

## License

MIT — include a `LICENSE` file if you intend to apply this license.

## Contact

For questions, open an issue or contact the project owner.


