Prompt: Create the Core of “Driftwood”

You are creating a minimal, atmospheric, front-end-only web experience called Driftwood.

This is not a game.
This is not a productivity tool.
This is not a dashboard.

It is a quiet, interactive, living environment.

The goal is to build a sturdy but minimal foundation that supports future creative exploration.

Core Principles

No accounts.

No analytics.

No scoring.

No visible UI clutter.

No productivity framing.

It should feel like entering a space, not using an app.

Design for mood, subtlety, and restraint.

Technical Requirements

Use Vite for setup.

Use React (functional components only).

Use Three.js for rendering.

Keep structure clean and modular.

No backend.

No database.

No routing needed yet.

Project structure should be clean and expandable.

Initial Scene Requirements

Create a minimal but atmospheric 3D environment with:

A dark gradient sky background

Very subtle fog

Slow drifting particle system (soft white or muted tone)

A faint ground plane (very dark, almost silhouette)

Soft ambient lighting

One distant, dim directional light

Camera:

Static but slightly floating (gentle idle motion)

Slow breathing-like vertical movement

Particles:

Randomized slow drift

Slight variation in size and opacity

Very low count (do not overwhelm)

Motion should feel alive but quiet.

Interaction (Very Minimal)

Mouse movement slightly shifts camera perspective (parallax effect)

No clicking interactions yet

No UI text on screen

Visual Tone

Color palette:

Deep charcoal

Muted forest green

Soft desaturated blue

Occasional faint warm amber glow

Avoid neon.
Avoid high contrast.
Avoid bright white.

Everything should feel dusk-like.

Code Quality Requirements

Clean component separation:

Scene

CameraController

Particles

Lighting

Keep logic readable.

Avoid over-engineering.

Comment sparingly but clearly.

Future Extensibility (Do Not Implement Yet)

Structure the code so it will later support:

A wandering silhouette entity

Time-of-day shifts

Generative ambient audio (Tone.js)

Hidden keyboard triggers

Mood-based color palette changes

But do NOT implement those yet.

Just ensure the architecture allows for them cleanly.

Output

Scaffold the project.

Provide all core files.

Include package.json.

Include a short README explaining:

What Driftwood is

How to run it

The philosophy behind it

Keep the README poetic but concise.

Final Constraint

Driftwood should feel like:

Standing alone in a quiet forest at dusk,
with something alive moving softly beyond your vision.

Do not gamify.
Do not optimize.
Do not explain the experience inside the app.

Just build the space.
