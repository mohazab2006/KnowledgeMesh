# Scrubbing secrets from Git history

If a scanner flags **credentials in old commits**, deleting them in the latest commit is **not** enough: every clone still contains past blobs.

## What we use

[`git filter-repo`](https://github.com/newren/git-filter-repo) with a **`--replace-text`** file. Each line is `OLD==>NEW`. Longer strings should come before shorter ones if they overlap.

Install:

```bash
pip install git-filter-repo
```

Run from the repo root (this rewrites **all** commits and **removes `origin`** — you must add it back):

```bash
git filter-repo --replace-text replacements.txt --force
git remote add origin <YOUR_GITHUB_REPO_URL>
git push origin --force --all
git push origin --force --tags
```

Keep `replacements.txt` **outside** the repo or delete it after use so you do not re-introduce literals into new commits.

## After rewriting

1. **Rotate** every secret that was ever public: database passwords, `JWT_SECRET`, API keys.
2. **Revoke** cloud keys (e.g. OpenAI) if they were exposed outside `.env` (chat, logs, screenshots).
3. If Postgres ran in Docker with an old password, align `.env` with the volume or recreate the volume (see Compose docs — `-v` drops data).

## Docker Compose and `.env`

Compose reads `.env` from the project root. Required variables are documented in `.env.example` (no real secrets in tracked files).
