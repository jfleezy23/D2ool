# Agent Instructions

Be a careful coding agent, not an eager patch generator.

## Before Editing

- Inspect the repo first: read local agent/project instructions, run git status, and identify dirty files.
- Assume existing dirty changes belong to the user or another agent. Do not revert, overwrite, stage, or clean up unrelated work.
- Understand the relevant code path before changing it. Prefer small, local edits that match existing patterns.

## While Working

- Keep scope tight. Do the requested task, not adjacent refactors.
- Avoid broad cleanup unless explicitly requested.
- Do not reshape public APIs, data models, architecture, build systems, or critical runtime paths unless the task requires it.
- When multiple agents may be working, avoid files outside the requested area and call out potential overlap.
- For UI work, verify layout, spacing, overflow, disabled states, and visual stability. Screenshots are evidence, not decoration.
- For bug fixes, identify the actual cause before patching symptoms.
- Keep this `AGENTS.md` updated when project-specific working rules change.

## Validation

- Run the most relevant targeted tests/checks first.
- Run broader tests when the change touches shared behavior or risky paths.
- If a tool or test cannot run, say exactly why and what was checked instead.
- Do not claim something is verified unless it actually ran.

## Git

- Never use `git add .` or `git add -A` unless explicitly told to.
- Stage explicit paths only.
- Before staging or committing, show/inspect git status and the diff.
- Keep commits focused by concern.
- Do not amend, reset, rebase, clean, force-push, or discard changes without explicit approval.

## Communication

- Be concise but concrete.
- State what changed, what was verified, and what remains uncertain.
- If the user sounds frustrated, prioritize accuracy and course correction over reassurance.
- Do not invent confidence. If unsure, inspect, test, or say what is uncertain.

## Product Rules

- Build a local/offline-first Destiny 2 weapon roll explorer for personal use.
- The app UI must say `Destiny 2`, not `Destiny II`.
- Normal app usage must run from generated local data and cached local assets.
- No hosted deployment, Bungie OAuth, player login, vault sync, DIM integration, or server backend for the MVP.
- React components must consume clean generated app data only.
- React components must not parse raw Bungie manifest structures such as `DestinyInventoryItemDefinition`, socket entries, plug sets, or reusable/randomized plug set hashes.

## Data Pipeline Order

1. Create and maintain the project skeleton, package scripts, README, and docs.
2. Implement manifest fetching.
3. Implement raw manifest loading.
4. Implement weapon extraction.
5. Implement perk and plug-set resolution.
6. Implement generated JSON output.
7. Implement tests.
8. Implement the basic offline UI.
9. Implement saved rolls.
10. Implement `/debug/data-health`.
11. Polish the UI after the manifest pipeline works.

