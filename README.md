![CI](https://github.com/nuclia/frontend/actions/workflows/deploy.yml/badge.svg)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fnuclia%2Ffrontend.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fnuclia%2Ffrontend?ref=badge_shield)

# Nuclia frontend apps and libraries

## Table of contents

- [Before Installation](#before-installation)
- [Installation](#installation)
- [Dashboard](#dashboard)
- [Widget](#widget)
- [RAO Widget](#rao-widget)
- [Auth app](#auth-app)
- [Admin app](#admin-app)
- [SDK](#sdk)
- [Sistema](#sistema)
- [NucliaDB admin](#nucliadb-admin)
- [CI/CD Deployment](#cicd-deployment)
- [Maintenance page](#maintenance-page)
- [Linters](#linters)
- [AI](#ai)

---

## Prerequisites

First you need to have NVM, NODE and YARN installed.

To install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating), run:

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

or

```
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

To check if it was installed properly, close and reopen the terminal and run `command -v nvm` and should return `nvm`. In case there is something else going on, troubleshoot with [this documentation](https://github.com/nvm-sh/nvm#troubleshooting-on-macos). To see all the commands, simply run `nvm`.

To install the latest stable version of [node](https://nodejs.org/en), run:

```
nvm install --lts
```

To check if node and npm is properly installed, run: `node --version` and `npm --version`.
<sub>Any problems should be resolved with the [nvm documentation](https://github.com/nvm-sh/nvm#readme).</sub>

To install [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable), run:

```
npm install --global yarn
```

Check if Yarn is installed by running: `yarn --version`.

#### Note

In the rest of this documentation, we use commands like `nx` and `missdev`. Those can be find in `node_modules/.bin` folder.
You can also install `nx` globally:

```
npm install -g nx
```

## Dependencies installation

```
yarn
```

Pastanaga-angular installation must be done through [missdev](https://github.com/collective/mrs-developer) so `sistema-demo` can run:

```
yarn missdev
```

If it fails for any reason, you can try to clone Pastanaga manually:

```
cd libs
git clone git@github.com:plone/pastanaga-angular.git
```

## Dashboard

Start by creating an account with an email and password (as SSO doesn't work locally).

- for Nuclia employees:

  In `apps/dashboard/src/environments_config`, create a file `local-stage/app-config.json` with the correct configuration to use the stage server. <sub>Ask a supervisor to get a proper configuration.</sub>

  Then you can run the dashboard locally and use the credential created previously to log in:

  ```
  nx serve dashboard
  ```

- for external developers:

  You can use the production server with your real account by running:

  ```
  nx serve dashboard -c local-prod
  ```

  Note: the login page will automatically redirect you to the https://nuclia.cloud so you can login and will redirect back to http://localhost:4200 with the auth token.

## Widget

[Documentation](https://docs.nuclia.dev/docs/rag/advanced/widget/features)

In the demo, the knowledge box id is hardcoded in `apps/search-widget-demo/src/App.svelte`.
Before launching the demo, replace this id by the one for your own **public** knowledge box.

Run the demo:

```
nx serve search-widget-demo
```

Build the widget:

```
nx build search-widget
```

When you have some local changes to the widget you'd like to test on the dashboard, you need to:

- build the widget
- copy the resulting `nuclia-widget.umd.js` to `assets` folder of dashboard app
- in `app.init.service.ts`, replace the line `injectWidget(config.backend.cdn);` to `injectWidget('/assets');`

## Auth app

The auth app supports the OAuth workflow and other auth related features.

As the backend is redirecting to the server, it might be painful to work locally.

If needed you can run the auth app on port 4201:

```
nx serve auth --port 4201 -c local-dev --host 127.0.0.1
```

And proxy auth.gcp-global-dev-1.nuclia.io calls to this local port with the following setup:

```
brew install nginx mkcert nss
cd ~/wherever
mkcert -install
mkcert auth.gcp-global-dev-1.nuclia.io
mkdir logs
```

In /etc/hosts, add:

```
127.0.0.1   localhost auth.gcp-global-dev-1.nuclia.io
```

Note: do not forget to undo that once finished, else you will not be able to access the real auth.gcp-global-dev-1.nuclia.io.

nginx.conf

```
# Required top-level block (even if empty)
events {}

http {
  # Keep logs local to this temp project (optional)
  access_log logs/access.log;
  error_log  logs/error.log;

  # Recommended: tighter proxy defaults
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto https;
  proxy_set_header X-Forwarded-For $remote_addr;

  server {
    # You'll need sudo to bind to 443 on macOS
    listen 443 ssl;
    server_name auth.gcp-global-dev-1.nuclia.io;

    # >>> Replace these with your mkcert outputs <<<
    ssl_certificate     auth.gcp-global-dev-1.nuclia.io.pem;
    ssl_certificate_key auth.gcp-global-dev-1.nuclia.io-key.pem;

    # Forward EVERYTHING under this host to your Angular dev server
    location / {
      proxy_pass http://127.0.0.1:4201;
    }
  }
}
```

```
sudo nginx -p $(pwd) -c nginx.conf -g 'daemon off;'
```

## Admin app

In `apps/admin/src/environments_config`, create a file `local-stage/app-config.json` with the correct configuration to use the stage server. <sub>Ask a supervisor to get a proper configuration.</sub>

Then you can run the admin app locally and use the credential created previously to log in:

```
nx serve admin
```

The admin app runs locally on port 4300, so you can run both the **admin app** and the **dashboard app** at the same time.

To make the locally-running dashboard app route account-management pages to your local admin app, add `"adminOrigin": "http://localhost:4300"` inside the `"backend"` object of `apps/dashboard/src/environments_config/local-stage/app-config.json`.

## SDK

[Documentation](https://docs.nuclia.dev/docs/develop/js-sdk/)

## Sistema

Sistema is Nuclia's design system. It is based on [Pastanaga](https://github.com/plone/pastanaga-angular).

The demo is available at [https://nuclia.github.io/frontend](https://nuclia.github.io/frontend).

To update the glyphs sprite:

- add/remove/edit glyphs in `libs/sistema/glyphs` folder
- run `update_icons` script:

```shell
./libs/sistema/scripts/update_icons.sh
```

## NucliaDB admin

To run it locally for dev purpose:

```
docker network create nucliadb-network
docker run -it -d --name pg --network nucliadb-network \
  -p 5432:5432 \
  -e POSTGRES_USER=nucliadb \
  -e POSTGRES_PASSWORD=nucliadb \
  -e POSTGRES_DB=nucliadb \
  postgres:latest
docker pull nuclia/nucliadb:latest --platform linux/amd64
docker build --platform linux/amd64 -t nucliadb-server -f ./tools/nucliadb-admin/Dockerfile .
docker run --network nucliadb-network \
    --name nucliadb-server \
    --platform linux/amd64 \
    -p 8080:8080 \
    -v nucliadb-standalone:/data \
    -e NUCLIA_PUBLIC_URL="https://europe-1.stashify.cloud" \
    -e NUA_API_KEY=<NUA_KEY> \
    -e LOG_LEVEL=DEBUG \
    -e DRIVER=PG \
    -e DRIVER_PG_URL="postgresql://nucliadb:nucliadb@pg:5432/nucliadb" \
    nucliadb-server
```

## CI/CD Deployment

### Scope

CI/CD deployment does not cover:

- the SDK as it is released in the NPM registry;
- the NucliaDB admin app as it is released in the Python registry.

It covers:

- the dashboard (not active at the time I am writing this doc, but will be soon);
- the widget (not active at the time I am writing this doc, but will be soon);
- the manager app

### Deploying to stage

When merging a PR, if it impacts the manager app, it is built and our `deploy_manager` job (in our `deploy` GitHub Action) will update Helm and then trigger a Repository Dispatch event to the `frontend_deploy` repo.

That's how the manager is deployed to **stage**.

### Promoting to production

Once the app is deployed on stage, you can promote it to production by going to https://github.com/nuclia/core-apps/actions/workflows/promote-to-global-production.yaml and clicking on "Run workflow".
Then, choose `auth`, `app`, `docs`, or `manager` component in the list (keep the default values for the rest) and click on "Run workflow".

To deploy the widget, use [https://github.com/nuclia/core-apps/actions/workflows/cdn-sync.yaml](https://github.com/nuclia/core-apps/actions/workflows/cdn-sync.yaml).

### About ArgoCD

ArgoCD allows to monitor deployments and also to read the logs of the different pods.

[Full documentation](https://github.com/nuclia/internal/blob/master/platform/cd-strategy.md)

## Maintenance page

The maintenance page is in `./maintenance`.
It is deployed manually to stage using the following command:

```sh
gsutil cp -r ./maintenance gs://ncl-cdn-gcp-global-stage-1
```

## External dependencies

We used to load some external libs from cdn.jsdelivr.net or cd./dashjs.net, but it was sometimes conflicting with some customers security policy.

So the following files have been manually uploaded in the Nuclia CDN:

https://cdn.jsdelivr.net/npm/marked/marked.min.js
https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js
https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.js\n
https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/web/pdf_viewer.css
https://cdn.dashjs.org/v4.7.1/dash.all.min.js

## Linters

We use **Prettier**, **ESLint**, and **SonarQube** to keep the codebase consistent and catch issues early.

### Pre-commit hook

A **Husky** pre-commit hook (`.husky/pre-commit`) runs automatically on every commit, in order:

1. `lint-staged` formats staged files with Prettier.
2. `nx affected --target=lint --uncommitted` runs ESLint on the projects affected by your uncommitted changes.
3. `nx affected --target=test --uncommitted` runs unit tests for those same affected projects.

The commit is blocked if any step fails, so problems are caught locally instead of in CI/review.

### SonarQube

SonarQube runs automatically in CI (see `.github/workflows/sonarqube.yml`) on every PR to `main`, so you don't need local access just to get a scan on your changes. Project configuration, including justified rule exclusions, lives in `sonar-project.properties` at the repo root.

Local access to the SonarQube dashboard (e.g. to browse existing issues) requires the **company VPN**. To get set up:

1. Ask IT support to create you a SonarQube user account.
2. Ask your supervisor to add that user to the `nuclia-frontend` project.
3. Log in and generate a personal access token.
4. Use the token to connect to [https://sonar.progress.com](https://sonar.progress.com).

## AI

This repo ships AI tooling on top of GitHub Copilot: a set of **skills** and **agents** encoding
the conventions we use in this project. They live under `.github/` (`.github/skills/` and
`.github/agents/`), so any Copilot client picking up this repo can use them automatically.

If you're using an AI coding assistant here, these help it write code that's closer to our
conventions and spend less time re-discovering the codebase on its own. As part of this, every
app and every big lib has its own `AGENTS.md` describing its structure, conventions, and gotchas —
check the relevant one before working in a sub-project.

### Keeping AGENTS.md up to date

`AGENTS.md` files can drift from the code over time. The **`knowledge-keeper`** agent
(`.github/agents/knowledge-keeper.md`) syncs them against the latest state of the code. Run it
after landing a big feature, or every once in a while as general maintenance.

It also keeps the **`product-knowledge`** skill (`.github/skills/product-knowledge/`) — our
cached copy of the platform API docs used by AI clients — in sync. For that part, it needs the
[`nuclia/docs`](https://github.com/nuclia/docs) repo checked out locally as a sibling folder of
this repo (i.e. `../docs` relative to this project).

Knowledge sync is manual for now: trigger it by typing `sync knowledge` in your Copilot client.

## License

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fnuclia%2Ffrontend.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fnuclia%2Ffrontend?ref=badge_large)
