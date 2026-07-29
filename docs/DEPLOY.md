# Deploy — Cloud Run + Firebase Hosting

CI/CD runs on GitHub Actions:

- **[ci.yml](../.github/workflows/ci.yml)** — every PR/push: typecheck + docker build validation.
- **[deploy.yml](../.github/workflows/deploy.yml)** — push to `main`: build & push the `api` + `ai`
  images to Artifact Registry, deploy them to Cloud Run, build the web bundle and deploy it to
  Firebase Hosting.

Region defaults to `me-west1` (Tel Aviv) — change the `REGION` in `deploy.yml` if you want another.

---

## One-time GCP setup

Run these once. Easiest in **Git Bash** (so the `$VAR` syntax works). Requires the
[gcloud CLI](https://cloud.google.com/sdk/docs/install) — `gcloud auth login` first.

```bash
# your Firebase/GCP project id
export PROJECT_ID=REPLACE_WITH_YOUR_PROJECT_ID
export REGION=me-west1
gcloud config set project "$PROJECT_ID"

# 1) enable the APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com firebasehosting.googleapis.com

# 2) Artifact Registry repo for the images
gcloud artifacts repositories create mixer \
  --repository-format=docker --location="$REGION" --description="Mixer service images"

# 3) the CI deployer service account + roles
gcloud iam service-accounts create mixer-ci --display-name="Mixer CI deployer"
export SA="mixer-ci@$PROJECT_ID.iam.gserviceaccount.com"
for ROLE in run.admin artifactregistry.writer iam.serviceAccountUser firebasehosting.admin; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role="roles/$ROLE"
done

# 4) key for the CI SA -> this file's contents becomes the GCP_SA_KEY secret
gcloud iam service-accounts keys create mixer-ci-key.json --iam-account="$SA"

# 5) let the Cloud Run RUNTIME service account reach Firebase Storage (api uses ADC, no key file)
export PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

**MongoDB Atlas:** Cloud Run has dynamic egress IPs, so in Atlas → Network Access add `0.0.0.0/0`
(allow anywhere) — safe as long as the DB user/password are strong. (Or set up a static egress
IP / PrivateLink later.)

---

## GitHub secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

> `GCP_PROJECT_ID` goes under the **Variables** tab, not Secrets. It isn't sensitive (it's
> part of every public Cloud Run URL), and as a secret it actively breaks the deploy: GitHub
> blanks out any job output that contains a secret value, so the Cloud Run URLs would arrive
> empty at the web build and the bundle would ship pointing at `localhost`.

| Secret | Value |
|---|---|
| `GCP_SA_KEY` | the **entire contents** of `mixer-ci-key.json` (then delete the file) |
| `MONGO_URL` | from `apps/api/.env` |
| `MONGO_DB` | from `apps/api/.env` |
| `JWT_SECRET` | from `apps/api/.env` |
| `GOOGLE_CLIENT_ID` | from `apps/api/.env` (optional — Google sign-in) |
| `PEXELS_API_KEY` | from `apps/api/.env` (optional) |
| `GROQ_API_KEY` | from `apps/ai/.env` |
| `GEMINI_API_KEY` | from `apps/ai/.env` |
| `GOOGLE_WEB_CLIENT_ID` | web Google sign-in client id (optional) |

---

## Go live

1. Do the GCP setup + add the secrets above.
2. Commit everything and push to `main`.
3. Watch **Actions** → `Deploy`. On success it prints the Cloud Run URLs and the Hosting URL
   (`https://<project-id>.web.app`).

First deploy takes a few minutes (image builds). Cloud Run URLs are stable across redeploys, so the
web bundle keeps pointing at the same api/ai.

---

## Troubleshooting

**"The user-provided container failed to start and listen on the port ... PORT=8080"** — the
process crashed on boot (or ran out of memory). The GitHub Actions log only reports the symptom;
the real error is in the container logs:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="mixer-ai"' \
  --limit 50 --freshness=1d --format='value(textPayload)'
```

Common causes: an env var the service reads at import time is missing (check the secrets table
above), or the revision ran out of memory during startup. The Dockerfiles deliberately do **not**
set `ENV PORT` — Cloud Run injects `PORT=8080` and the services must honour it.





