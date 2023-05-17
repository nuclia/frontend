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

----
## Before Installation

First you need to have NVM, NODE and YARN installed.

To install [nvm](https://github.com/nvm-sh/nvm#installing-and-updating), run:
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```
or
```
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
```

To check if it was installed properly, close and reopen the terminal and run "```command -v mvn```" and should return "```mvn```". In case there is something else going on, troubleshoot with [this documentation](https://github.com/nvm-sh/nvm#troubleshooting-on-macos). To see all the commands, simply run "```nvm```".


To install the latest version of [node](https://nodejs.org/en), run:
```
nvm install node
```

To check if node and npm is properly installed, run: "```node --version```" and "```npm --version```". <sub>Any problems should be resolved with the [mvn documentation](https://github.com/nvm-sh/nvm#readme).</sub>

To install [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable), run:
```
npm install --global yarn
```
Check if Yarn is installed by running: "```yard --version```"



## Installation

```
yarn
```

Pastanaga-angular installation must be done through [missdev](https://github.com/collective/mrs-developer) so `sistema-demo` can run:

```
missdev --output=../libs
```

## Dashboard

Start by creating an account with an email and password (as SSO doesn't work locally).

In `apps/dashboard/src/environments_config`, create a file `local-stage/app-config.json` with the correct configuration.

Then you can run the dashboard locally and use the credential created previously to log in:

```
nx serve dashboard
```

## Widget

[Documentation](https://docs.nuclia.dev/docs/widget/api)

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

[Documentation](https://docs.nuclia.dev/docs/sdk)

## Desktop app

Run the UI in the browser:

```
nx serve desktop
```

Launch the server:

```
yarn desktop-server-dev
```

Build for stage:

```
./tools/build-desktop.sh
```

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
