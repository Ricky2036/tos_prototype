# Multi-Agent Workspace Protocol

This repository is built by **Workbuddy, Antigravity, and DSH**. **Codex plans on demand**
(task decomposition, architecture, hard root-cause work) and does not write implementation code.

**Roles and cost routing: `docs/roles-v2.md`.** Read it before taking work.
Execution protocol: `docs/tOS-pipeline-1.0.md`.

## Identify your role

Use the current worktree directory name:

- `tos-workbuddy` -> read `.agent-assignments/workbuddy.md`
- `tos-codex` -> read `.agent-assignments/codex.md`
- `tos-antigravity` -> read `.agent-assignments/antigravity.md`
- `tos-dsh` -> read `.agent-assignments/dsh.md`
- `2026-08-02-23-04-06` -> integration worktree; Antigravity is the designated integration owner and feature work is not implemented here

If the directory name does not match one of these values, stop and ask which role owns the workspace.

## Take work from the queue, not from a person

`.tasks/queue/` holds ready work. **Whoever is free takes the next `ready` card**, fills
`owner`, registers the cluster in `.claims/`, and releases it when done. There is no
"this is my area" — a cluster is a resource, not a territory.

A card is finished only when its 验收 command passes and `node scripts/gate-merge.mjs` is green.

## Check your inbox first

Before starting any task, read `.tasks/inbox/<your role>.md` (e.g. `.tasks/inbox/workbuddy.md`).
Cross-lane handoffs are delivered there — a `.tasks/<id>.md` card plus a patch under
`.tasks/patches/`.

**Never `git checkout` files from another lane's branch into your worktree.** That stages
foreign changes under your branch and forces you to either commit work you don't own or
carry a dirty index. The inbox only works because these files live on `main`; if they do not,
ask the Integrator to merge the infrastructure branch first.

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
   - `tos-dsh`: `7777`
10. If a task conflicts with these defaults, the written task assignment wins only for the files it names.

## Verification cadence

Two modes. Do not pay delivery cost after every keystroke.

- **Daily (every edit).** Target only what changed:
  - `node scripts/run-e2e.mjs --changed` — derives the affected suites from path prefixes and runs only those. Pass `--port <your port>`.
  - `node --test tests/*.test.js` — the whole unit suite, **82 files / 824 cases, ~8 s**.
  - Vite HMR covers everything else; there is nothing to restart.
- **Before handoff / merge.** Run the local gate (**22 s**):
  - `node scripts/gate-merge.mjs` — unit tests + production build + G7 assert ratchet.
  - `node scripts/check-assert-ratchet.mjs` — 用例数只增不减；删断言换绿灯会被拦下。
- **Delivery (only when the task says package / commit / hand off).**
  - `node scripts/run-e2e.mjs --all --port <your port>` — **14 suites, 632 s serial**.
  - Machine time only. `--jobs 4` finishes in ~110 s but **produces false failures** (measured 2026-11-12: settings-group3 176/3 vs 179/0 solo). Do not use `--jobs` for anything you will act on.
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
