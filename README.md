![CI](https://github.com/nuclia/frontend/actions/workflows/deploy.yml/badge.svg)

# Nuclia frontend apps and libraries

## Install

```
yarn
```

## Dashboard

Run locally:

```
nx serve app -c local-stage
```

(make sure to create `apps/app/src/environments_config/local-stage/app-config.json` with the correct configuration)

## Widget

Run the demo:

```
nx serve search-widget-demo
```

Build the widget:

```
nx build search-widget
```

[Documentation](https://docs.nuclia.dev/docs/widget/api)

## SDK

[Documentation](https://docs.nuclia.dev/docs/sdk)
