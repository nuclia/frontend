# Nuclia widget

The Nuclia widget allows to embed a ready-to-use search box in your website or web application.

## Usage as a web component

Copy/paste the following snippet in your HTML code:

```html
<script src="https://cdn.rag.progress.cloud/nuclia-widget.umd.js"></script>
<nuclia-search-bar
  knowledgebox="<YOUR-KB-ID>"
  zone="europe-1"
  features="filter,permalink"></nuclia-search-bar>

<nuclia-search-results></nuclia-search-results>
```

## Usage as Svelte components

You need to install the following dependencies:

```bash
npm install @nuclia/widget @nuclia/core rxjs@^7.5.2 date-fns sass
```

Then, you can use the components in your Svelte code:

```html
<script lang="ts">
  import { NucliaSearchBar, NucliaSearchResults } from '@nuclia/widget';
</script>

<NucliaSearchBar
  zone="europe-1"
  knowledgebox="<YOUR-KB-ID>"
  lang="en"
  placeholder="Search"
  features="filter,suggestions,permalink" />

<NucliaSearchResults />
```
