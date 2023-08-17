![CI](https://github.com/nuclia/frontend/actions/workflows/deploy.yml/badge.svg)

# Nuclia frontend apps and libraries

## Table of content

- [Before Installation](#before-installation)
- [Installation](#installation)
- [Dashboard](#dashboard)
- [Widget](#widget)
- [SDK](#sdk)
- [Desktop app](#desktop-app)
- [Sistema](#sistema)
- [Protobuf library](#protobuf-library)
- [CI/CD Deployment](#cicd-deployment)

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

In the rest of this documentation, we use commands like `nx` and `missdev`. Those can be find in `node_modules/.bin` folder. To use them directly you can add `node_modules/.bin` folder to your command line path.
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

[Documentation](https://docs.nuclia.dev/docs/docs/using/widget/features)

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

## SDK

[Documentation](https://docs.nuclia.dev/docs/docs/sdk/js_sdk_api)

## Desktop app

### Configuration

Desktop application needs two configuration files to run:

- in `apps/desktop/src/environments_config`, create a file `local-stage/app-config.json` with the correct configuration.
- in `apps/desktop/src/environments`, create a file `environment.dev.ts`

### Run & Build

Run the UI in the browser:

```
nx serve desktop
```

Launch the server:

```
yarn desktop-server-dev
```

Note: the server can be used appart from the UI. It persists all its data in `~/Library/Application\ Support/nuclia/connectors-db.json`.

Build for stage:

```
./tools/build-desktop.sh
```

### How to add a connector

The desktop app is composed of 2 parts:

- the frontend, which is a web app built with Angular and wrapped in Electron
- the backend, which is a NodeJS server

When adding a new connector, you need to add it to both parts.

The frontend part is in charge to declare the parameters the user will have to provide when configuring the connector, and will manage the OAuth flow (if any).

The backend part is in charge to implement the connector logic, i.e. the code that will fetch the data from the source.

In both cases, you have to implement a class in TypeScript that extends a given base class (be careful, the base classes have the same name in the 2 cases but they are different) and declare it in a constant.

In the frontend, you need to create a new file in `apps/desktop/src/app/sync/sources`, and implement a class extending `ISourceConnector`.
This class is a pure TypeScript classes, it is not Angular based (which is good, so people not knowing about Angular can contribute to the desktop app, but it also means it can not inject Angular services, anyway, that should not be needed).
Then the class plus the connector metadata (title, logo, etc.) must be declared in a `SourceConnectorDefinition` constant, and this constant must be imported in `apps/desktop/src/app/sync/sync.service.ts` and added to the `sources` property.

In the backend, you need to create a new file in `apps/desktop/electron/src/service/connectors`, and implement a class extending `ISourceConnector` (same name as the frontend one, but different methods and properties). It must be declared in a `SourceConnectorDefinition` constant, and this constant must be imported in `apps/desktop/electron/src/service/connectors.ts` and added to the `connectors` constant.

The OneDrive connector is a typical use case, it can be used as an example.

## Sistema

Sistema is Nuclia's design system. It is based on [Pastanaga](https://github.com/plone/pastanaga-angular).

The demo is available at [https://nuclia.github.io/frontend](https://nuclia.github.io/frontend).

To update the glyphs sprite:

- add/remove/edit glyphs in `libs/sistema/glyphs` folder
- run `update_icons` script:

```shell
./libs/sistema/scripts/update_icons.sh
```

## Protobuf library

Get lastest proto files from nucliadb (assuming nucliadb and frontend are in 2 siblings folders):

```sh
cd libs/sdk-core/protobuf
./update.sh
```

Build the library:

```sh
cd libs/sdk-core/protobuf
./build.sh
```

Publish the library:

```sh
cd libs/sdk-core/protobuf/build/protobuf
npm publish
```

## CI/CD Deployment

### Scope

CI/CD deployment does not cover:

- the desktop app as its artefacts are released directly in the Github repo;
- the SDK as it is released in the NPM registry;
- the contributor app as it is released in the Python registry.

It covers:

- the dashboard (not active at the time I am writing this doc, but will be soon);
- the widget (not active at the time I am writing this doc, but will be soon);
- the manager app

### Deploying to stage

When merging a PR, if it impacts the manager app, it is built and our `deploy_manager` job (in our `deploy` GitHub Action) will update Helm and then trigger a Repository Dispatch event to the `frontend_deploy` repo.

That's how the manager is deployed to **stage**.

You can see the deployment on [Stage ArgoCD](http://stashify.argocd.nuclia.com/applications/argocd/manager?view=tree&conditions=false&resource=).

### Promoting to production

Once the app is deployed on stage, you can promote it to production by going to https://github.com/nuclia/stage/actions/workflows/promote-to-production.yaml and clicking on "Run workflow".
Then, choose the `manager` component in the list (keep the default values for the rest) and click on "Run workflow".

It triggers the prod promotion, and it can be monitores on [Prod ArgoCD](http://europe1.argocd.nuclia.com/applications/argocd/manager?view=tree&resource=).

### About ArgoCD

ArgoCD allows to monitor deployments and also to read the logs of the different pods.

[Full documentation](https://github.com/nuclia/internal/blob/master/platform/cd-strategy.md)
