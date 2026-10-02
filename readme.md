# Disaster AI — Internal Hackathon MVP

A no-backend prototype built on three **real** disaster events. It covers how
satellite and citizen evidence combine into a verified damage case whose relief
and recovery can be traced.

## Screens

| # | Screen | What it shows |
| --- | --- | --- |
| 01 | Case index | The three events with their sourced death / affected / displaced figures |
| 02 | Overview | Recorded impact with source links, event map, operational stats |
| 03 | Damage | Before/after satellite view, grid change detection, detected zones |
| 04 | Relief | Approved → disbursed → utilized, village detail, utilization mismatch |
| 05 | Recovery | Village-level restoration bars and overall recovery |


## Data provenance

Everything lives in `lib/data.ts`, and the two halves are labelled so they are
never confused:

| Field group | Status |
| --- | --- |
| `meta.facts.*` — deaths, affected, displaced, homes damaged, rainfall, economic loss | **Sourced.** Primary/official reports are linked from the Overview panel |
| Scenario and village coordinates, event dates | **Sourced.** `Village.coordsVerified` flags the handful placed within a block rather than at a documented point |
| `families`, `approved`, `disbursed`, `utilized`, `progress`, `severity`, `totalFund`, AI `confidence` | **Modelled.** No public record of village-level relief disbursement exists for these events, so these drive the workflow and must not be read as historical |

Some figures are genuinely contested and the data says so in `facts.notes` —
Kerala's death toll varies by date range (433 in the state PDNA vs 483–500 in
later compilations), Amphan's toll depends on whether Odisha is included
(86 in West Bengal, 128–133 across states), and Wayanad's missing-person count
is disputed (47 vs 118). Where a figure is statewide rather than district-level,
the note says so.

The map is a **real Leaflet map** with OpenStreetMap + **satellite** layers and
village markers. Pre/post scenes show *live current* imagery with a filter, not
imagery captured on the event dates — the dates are labels, not acquisitions.

## Map tiles

Tile URLs all live in `lib/mapTiles.ts`; every map shares that one decision.

Two providers, split by zoom band rather than switched wholesale:

| Zoom | Provider | Satellite | Streets | Max zoom |
| --- | --- | --- | --- | --- |
| z0–18 | Esri / OSM | `World_Imagery` + labels | `tile.openstreetmap.org` | 18 |
| z19–22 | MapTiler | `hybrid` | `streets-v2` | 22 |

Esri advertises levels to z23 but only z0–z18 are actually populated — past
z18 it returns HTTP 200 with a flat grey tile, so it fails silently rather than
erroring.

The split exists for speed. Measured over 20-tile viewport fills, Esri's CDN
answers in ~170–340ms per tile while MapTiler's free tier takes ~800–1200ms at
every zoom we tried. That is server-side render latency, not payload size —
tiles are ~10–13KB either way, and webp is smaller but slower to produce. So
the fast provider serves every zoom anyone normally views, and MapTiler only
takes over past z18, where its extra depth is the sole reason it is there.
Serving everything from MapTiler measured **3.4× slower first paint**. The
bands do not overlap, so exactly one provider is ever fetching.

A free MapTiler key is inlined in `lib/mapTiles.ts`. To move it out of git,
put it in `.env.local` (the env var wins over the inline value) and see
`.env.example` for the dashboard settings that lock it down. MapTiler's free
tier is 100k requests/month, non-commercial, and pauses the service if you
exceed it — with this split it only bills tiles you actually zoom into.
MapTiler keys are public client keys, so the one shipped to the browser is
meant to be there; restrict it by HTTP origin in the dashboard rather than by
hiding it.

Map containers are capped at the provider's real ceiling (`basemapMaxZoom`), so
you cannot zoom past the imagery into flat background. Tile layers use
`keepBuffer: 2` and `updateWhenIdle`, so panning back over ground already
fetched does not re-request it and interaction does not thrash redraws.

HiDPI sharpness uses Leaflet's `detectRetina`, which fetches zoom+1 and
downsamples for **1 request per tile**. MapTiler's native `@2x` endpoint gives
the same sharpness but bills **4 requests per tile**, which would burn the free
tier four times faster.

## Theming

Dark/light themes via a header toggle (persisted). Severity accents stay legible
in both modes; satellite imagery stays natural while street tiles follow the
theme.

## Design protocol

Built to an Operate-mode dashboard aesthetic: warm graphite surfaces, no pure
black/white, no gradients or glassmorphism, monospace numerals for every stat,
1px hairline separators instead of nested cards, and exactly one reserved
`200ms ease-out` reveal moment for the decisive AI/anomaly transitions.

## Walkthrough (60–90s)

Pick an event on the index → read the sourced impact figures and their source
links on Overview → run change detection on Damage → disburse funds, hit the
utilization mismatch, then advance 30 days to close out restoration on Recovery.

## What was cut

The prototype originally carried a fair amount of decoration that did not earn
its place, and a few claims the code could not support. Both went:

- Three copies of the tagline "From damage to recovery" / "Every rupee is
  linked to a village" — one was the page hero, one the page footer, one the
  Recovery screen.
- The landing page's marketing aside (`Response workflow` / `One traceable case`
  / `TRACEABLE`) listed three invented steps that duplicated the real nav, above
  a pair of speculative fund figures shown before you had picked an event. The
  index now lists the actual events with their actual figures.
- Overview's `Response chain` cards re-rendered the header nav, and its
  `Fund Chain` block repeated the Relief screen.
- Relief rendered the same five lifecycle stages twice, as a stepper and as a
  dated timeline.
- Damage printed a ~20-line pseudo-terminal "AI Analysis Report" and repeated
  its stats in a separate breakdown table.
- Claims the app could not back up: `Sentinel-2`, `NDVI`, `NDWI`, `NDBI` and
  specific index values like "NDVI dropped from 0.62 to 0.21". The app renders
  Esri/MapTiler Web Mercator tiles and computes no spectral indices at all, so
  the Damage screen and the zone tooltips no longer name any. The screen now
  states plainly that both panels show live current imagery and that the dates
  are labels, not acquisitions.

## Saved progress

Case state (selected event, section, per-village disbursement/utilisation,
restoration state, day counter) is written to `localStorage` under
`innovision:case:v1`, so a reload drops you back where you were instead of
replaying the flow.

Stored state is validated on load against the shipped dataset: if the scenario is
unknown, or the stored village ids no longer match the scenario's, the state is
discarded and the sample data is used. That way a rename or removal in
`lib/data.ts` can't leave a stale panel rendering empty after a deploy. **Reset**
in the header clears the key.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

The impact figures on that path are sourced; the confidence scores, rupee
amounts and progress percentages are the modelled layer.