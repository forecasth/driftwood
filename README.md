# Driftwood

Driftwood is a front-end-only atmospheric world built with React, Vite, and Three.js.
It is not a game, a tool, or a puzzle.
It is a ring of twelve quiet climates: seasonal moods, weather states, and inward places.

## Run

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## World Structure

The ring is now split into twelve modular seasonal segments.
Each segment is driven by its own scene config, palette, tree profile, fog density, particle behavior, lighting bias, accent object, and future interaction placeholder.

Shared systems live in:

- `src/components/world`
- `src/components/environment`
- `src/components/camera`
- `src/scenes/common`
- `src/data`

Per-scene modules live in `src/scenes/season-xx-*` and each scene owns:

- `config.js` for atmosphere, motion, palette, and interaction scaffolding
- `SceneAccent.jsx` for one subtle local visual signature

## The Twelve Scenes

1. Ashen Thaw: damp late-cold, sparse life, grey-blue hush.
2. Vernal Hush: shy first growth and cautious green lift.
3. Rain Bloom: saturated mist, closeness, and lush density.
4. Goldair: open warm light and restrained radiance.
5. Highsummer Static: heavy abundance and suspended heat.
6. Stormglass: charged air, sharper silhouettes, directional drift.
7. Harvest Echo: amber memory, thinning warmth, gentle loss.
8. Emberfall: low afterheat, exposed earth, intimate descent.
9. First Frost: crisp return of cold, clean space, alert stillness.
10. Long Night: deep winter dark, solitude, and inward shelter.
11. Deep Still: silver-blue calm, meditative suspension, almost-sacred quiet.
12. Returning Light: cold turning toward warmth, threshold glow, renewed beginning.

## Add Or Modify A Scene

1. Edit or add a scene folder in `src/scenes/season-xx-*`.
2. Adjust `config.js` for palette, fog, particles, lighting, trees, ground, motion, and interaction notes.
3. Update `SceneAccent.jsx` if the segment needs a different local feature.
4. Register the scene in `src/scenes/common/sceneRegistry.js`.
5. Keep the total scene count aligned with `src/data/worldConfig.js`.

## Philosophy

Driftwood is built around restraint.
The goal is not spectacle.
The goal is twelve forms of weather inside a quiet inner world.
