# Multi-Agent Workspace Protocol

This repository is developed concurrently by Workbuddy, Codex, and Antigravity.
Read this file before changing any code.

## Identify your role

Use the current worktree directory name:

- `tos-workbuddy` -> read `.agent-assignments/workbuddy.md`
- `tos-codex` -> read `.agent-assignments/codex.md`
- `tos-antigravity` -> read `.agent-assignments/antigravity.md`
- `2026-08-02-23-04-06` -> integration worktree; Antigravity is the designated integration owner and feature work is not implemented here

If the directory name does not match one of these values, stop and ask which role owns the workspace.

## Mandatory rules

1. Work only in your assigned worktree and branch. Never change branches in place.
2. Before starting, run `git status --short --branch` and read your role file.
3. Never discard, reset, stash, or overwrite changes you did not create.
4. Do not edit shared integration files unless the current task explicitly assigns them to you.
5. Keep commits small and task-specific. Stage explicit paths; do not use `git add -A`.
6. Do not merge or cherry-pick into `main`. Antigravity does that centrally from the integration worktree.
7. Do not push `main`, force-push, or rewrite published history.
8. Run the checks listed in your role file before handoff.
9. Use the development port assigned to your role with `--strictPort`:
   - `2026-08-02-23-04-06` (integration / `main`): `9999`
   - `tos-antigravity`: `1111`
   - `tos-workbuddy`: `5555`
   - `tos-codex`: `8888`
10. If a task conflicts with these defaults, the written task assignment wins only for the files it names.

## Verification cadence

Two modes. Do not pay delivery cost after every keystroke.

- **Daily (every edit).** Target only what changed:
  - `node scripts/run-e2e.mjs --changed` — derives the affected suites from path prefixes and runs only those.
  - `node --test tests/*.test.js` — the whole unit suite, 48 files, ~8 s.
  - Vite HMR covers everything else; there is nothing to restart.
- **Delivery (only when the task says package / commit / hand off).**
  - `node scripts/run-e2e.mjs --all --jobs 4` — all 8 suites, ~82 s (serial is ~315 s).
  - Then commit, push, and package.

Run the full suite **once at handoff**, not after every edit. If you only ran part of it, say so.

**Never skip browser verification to save time.** Nearly every defect in this repo is pixel-level:
clipped corners, an overlay landing 16 px outside the frame, a 9 px title misalignment, text under
12 px. Unit tests cannot see any of it. Pick a smaller suite — never drop the check.

⚠️ This repo auto-commits, so a clean working tree is normal. To diff against a ref, pass it
explicitly: `node scripts/run-e2e.mjs --changed origin/main`.

## Shared-file lock

These files are high-conflict integration surfaces and are integration-owned by default:

- `package.json` and package lock files
- `src/App.vue` and `src/main.js`
- `src/config/apps.js`
- `src/components/apps/registry.js`
- `src/components/phone/ScreenView.vue`
- `src/components/system/AppWindow.vue`
- `src/components/system/HomeScreen.vue`
- `src/stores/homeStore.js`
- `src/stores/systemStore.js`
- `src/styles/tokens.css` and `src/styles/global.css`
- `src/composables/useHeroTransition.js`
- `src/utils/appIconAnchors.js` and `src/utils/heroGeometry.js`

To change a shared file, first record the exclusive owner in `.agent-assignments/ACTIVE_TASKS.md` in the integration worktree. Only that owner may change it until the task is merged or released.

## Starting a task

1. Sync the worktree from the latest integration commit as directed by the integration owner.
2. Add one row to `.agent-assignments/ACTIVE_TASKS.md` through the integration owner.
3. Confirm that no other active row owns the same files.
4. Implement only the named scope and its tests.

## Handoff format

Every completed task must report:

- task name
- branch and commit SHA
- exact files changed
- tests/build run and results
- known risks or follow-up work
- whether any shared-file lock can be released

Antigravity cherry-picks one task at a time from the integration worktree, verifies it, updates `ACTIVE_TASKS.md`, and then publishes `main`.
