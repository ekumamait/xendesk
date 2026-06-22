# Git Workflow & Deployment Guide

## Branch model

- **`main`** — production branch. It begins as a single clean root commit
  (`chore: initialize repository`) that contains only a short README; real
  application code lands here only when you merge `dev` for a release. Vercel's
  _Production Branch_ is set to `main`, so a `dev -> main` merge triggers a
  production deploy.
- **`dev`** — integration / default branch. All feature work is merged here
  first. Pushing to `dev` produces Vercel _Preview_ deployments.
- **`feat/*`, `test/*`, `ci/*`, `docs/*`** — stacked task branches.

## The branches are STACKED

Each task branch was built on top of the previous one, so every branch contains
all the commits beneath it:

```
dev
└─ feat/auth-rbac
   └─ feat/ticket-api
      └─ feat/comment-api
         └─ feat/tags
            └─ feat/ui-shell
               └─ feat/ui-customer
                  └─ feat/ui-agent
                     └─ feat/ui-ticket-detail
                        └─ test/unit
                           └─ ci/github-actions
                              └─ docs/readme   (tip = full app)
```

Because of this, **`dev` is a strict ancestor of every task branch**, and each
task branch is an ancestor of the one above it. Merges are therefore
fast-forwards with zero conflicts.

## Merging into `dev` (two equivalent options)

> If branch protection requires pull requests (see below), open a PR from the
> branch into `dev` instead of pushing directly; the merges are still
> conflict-free.

### Option 1 — merge the tip once (simplest)

The tip branch `docs/readme` already contains everything:

```bash
git checkout dev
git merge --ff-only docs/readme
git push origin dev
```

### Option 2 — merge each branch in stack order

Each step is a fast-forward:

```bash
git checkout dev
for b in feat/auth-rbac feat/ticket-api feat/comment-api feat/tags \
         feat/ui-shell feat/ui-customer feat/ui-agent feat/ui-ticket-detail \
         test/unit ci/github-actions docs/readme; do
  git merge --ff-only "$b"
done
git push origin dev
```

## Can I merge GitHub Actions into `dev` FIRST, then deploy, then the rest?

**Yes.** Because the branches are stacked, `ci/github-actions` already includes
all feature + test code beneath it. So this exact order works and is
conflict-free:

```bash
# 1. Fast-forward dev to the full app + CI (conflict-free)
git checkout dev
git merge --ff-only ci/github-actions
git push origin dev          # CI runs on dev; Vercel builds a Preview

# 2. Connect Vercel and deploy (see below); verify the Preview / Production

# 3. Bring in the remaining README
git merge --ff-only docs/readme
git push origin dev
```

`ci/github-actions` fast-forwards `dev` to the full application plus the CI
workflow, so CI runs immediately on the `dev` push and Vercel produces a
preview. After deploying, only the README remains to merge.

## Releasing to production

```bash
git checkout main
git merge --no-ff dev        # common ancestor is the clean root commit C0
git push origin main         # Vercel deploys production
```

Both `main` and `dev` descend from the same clean root commit
(`chore: initialize repository`), so the merge has a common ancestor — there are
no "unrelated histories" and no conflicts. `main`'s short README is replaced by
the full project README that lives on `dev`.

## Vercel

- **Production Branch:** `main`.
- **Preview deploys:** every push to `dev` (and pull requests).
- **Production deploy:** when `dev` is merged into `main`.
- **Environment variables:** `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`,
  `AUTH_URL`.
- The `build` script runs `prisma migrate deploy` before `next build`, so
  migrations are applied automatically on each deploy.

## GitHub branch protection (recommended)

In **Settings → Branches → Add branch protection rule** for both `dev` and
`main`:

- Require a pull request before merging.
- **Require status checks to pass before merging**, and select the CI job
  (`Lint, typecheck, test, build` from `.github/workflows/ci.yml`).
- Optionally require branches to be up to date before merging, and require
  linear history.

This guarantees the GitHub Actions checks are green before anything lands on
`dev` or `main`.
