# Disaster AI — Internal Hackathon MVP

> Satellite + citizen evidence → verified damage case → traceable fund flow → recovery.
> One verified case, end to end.

A minimal, demo-data prototype (no backend, no real APIs, no GIS). It proves the
core innovation: **how satellite and citizen evidence combine into a verified
damage case whose relief and recovery can be traced.**

## Screens


| #   | Screen       | What it shows                                                                 |
| --- | ------------ | ----------------------------------------------------------------------------- |
| 01  | Dashboard    | Area selector (Maharashtra → District → Village), 4 metrics, real India map   |
| 02  | Damage       | Pre/post satellite comparison → simulated AI change detection                 |
| 03  | Verification | Case `DM-1042` evidence chain, citizen photo + GPS, confidence, Verify action |
| 04  | Funds        | Approved → disbursed → utilized relief, utilization %, anomaly detection      |
| 05  | Recovery     | Weekly recovery progress + satellite-change signal                            |


All data is deterministic and lives in `lib/data.ts`. The damage map is a **real
Leaflet map of India** with OpenStreetMap + **Esri satellite** layers and village
markers. Pre/post satellite scenes in Damage are lightweight SVG stand-ins.

## Theming

Dark/light themes via a header toggle (persisted). Severity accents stay legible
in both modes; OpenStreetMap tiles are auto-darkened in dark mode while
satellite imagery stays natural.

## Design protocol

Built to an Operate-mode dashboard aesthetic: warm graphite surfaces, no pure
black/white, no gradients or glassmorphism, monospace numerals for every stat,
1px hairline separators instead of nested cards, and exactly one reserved
`200ms ease-out` reveal moment for the decisive AI/anomaly transitions.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```



## Demo story (60–90s)

Select a village → satellite shows high damage (91%) → citizen report arrives → evidence cross-verified (89%) → relief allocated ₹50k / disbursed ₹40k → utilization mismatch detected (₹10k) → 88% recovery monitored.