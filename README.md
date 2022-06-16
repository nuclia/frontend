![CI](https://github.com/nuclia/frontend/actions/workflows/deploy.yml/badge.svg)

# Nuclia frontend apps and libraries

## Install

```
yarn
```

Pastanaga-angular installation must be done through [missdev](https://github.com/collective/mrs-developer) so `sistema-demo` can run:
``` 
missdev --output=../libs
```

## Dashboard

Start by creating an account with an email and password (as SSO doesn't work locally).

The dashboard is named `app` in the source code and can be accessed through `frontend/apps/app`.
In `apps/app/src/environments_config`, create a file `local-stage/app-config.json` with the correct configuration.

Then you can run the dashboard locally and use the credential created previously to log in:

```
nx serve app -c local-stage
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

Run in the browser:

```
nx serve desktop
```

Run in electron:

```
nx serve desktop
nx serve desktop-electron
```

Build for stage:

```
./tools/build-desktop.sh
```
