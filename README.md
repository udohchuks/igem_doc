# iGEM Doc Hub 🧬

A premium, state-of-the-art synthetic biology workspace and protocol repository built using **Next.js 16**, **React 19**, and **TypeScript**. 

This hub is designed to help iGEM (International Genetically Engineered Machine) teams organize biological standards, BioBricks, biosafety reports, and wetlab protocols with a modern, high-tech dark mode aesthetic.

---

## 🚀 Key Features

- **Standardized iGEM DNA & BioBrick Database**: Pre-populated biological documents with filtering capabilities.
- **Interactive Sequence & Protocol Synthesizer Terminal**: Click-to-validate DNA constructs and check restriction compatibility (RFC[10] standard check) and containment safety level.
- **Biotech Glassmorphism UI**: Beautiful cyber-themed green/cyan glows, responsive grid structures, pulsing state indicators, and premium Geist typefaces.
- **Optimized Performance**: Next.js 16 App Router utilizing Turbopack compiling, building statically for zero latency and exceptional SEO.

---

## 🛠️ Getting Started

Follow these steps to run the iGEM Doc Hub in your local environment.

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the application.

### 3. Production Build

To compile the production-grade static build, run:

```bash
npm run build
```

---

## 📂 Project Architecture

```bash
c:\Users\chukw\igem_doc
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css         # Global design system & variables
│   │   ├── layout.tsx          # Root layout and font configurations
│   │   ├── page.tsx            # Main stateful home page
│   │   └── page.module.css     # Modular dashboard and terminal styles
├── public/                     # Static assets (icons, images)
├── next.config.ts              # Next.js configurations
├── tsconfig.json               # TypeScript configurations
└── package.json                # Dev scripts and dependencies
```

---

## 🔬 Design Guidelines

- **Primary Accent**: `#00F5A0` (Neon Bio-Green) — represents active biological synthesis/validation.
- **Secondary Accent**: `#00D9F6` (Cyber Cyan) — represents computational structure.
- **Typography**: Vercel's premier **Geist** font family for high-fidelity technical documentation reading.
- **Aesthetic Core**: High contrast, subtle neon radial glow backdrops, crisp borders, and smooth micro-animations.

---

*Standardized under iGEM wetlab & biosafety containment regulations.*
