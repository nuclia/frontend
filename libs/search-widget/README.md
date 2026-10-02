# Nuclia widget

The Nuclia widget allows to embed a ready-to-use search box in your website or web application.

## Chat composer appearance

Set these optional CSS custom properties on the chat widget or its container. Defaults
preserve the standard composer appearance.

| Property                                 | Default                   | Purpose                                                                           |
| ---------------------------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| `--custom-chat-input-border-radius`      | `0`                       | Composer corner radius                                                            |
| `--custom-chat-input-shadow`             | `none`                    | Composer elevation shadow                                                         |
| `--custom-chat-input-focus-border-color` | Existing border colour    | Composer border colour while an input or control has focus                        |
| `--custom-chat-input-leading-display`    | Existing display value    | Set to `none` to hide both the leading chat icon and its clear-button replacement |
| `--custom-chat-input-padding-inline`     | `0`                       | Horizontal padding inside the composer                                            |
| `--custom-chat-input-padding-block`      | `0`                       | Vertical padding inside the composer                                              |
| `--custom-textarea-white-space`          | `preserve`                | Sizing mirror wrapping; use `pre-wrap` for multiline growth                       |
| `--custom-textarea-overflow-wrap`        | `normal`                  | Long-word wrapping in the textarea and sizing mirror                              |
| `--custom-textarea-margin`               | Existing vertical margin  | Textarea and sizing mirror margin                                                 |
| `--custom-chat-message-overflow-wrap`    | `normal`                  | Long-word wrapping in questions and answers                                       |
| `--custom-chat-question-white-space`     | `normal`                  | Set to `pre-wrap` to preserve question line breaks                                |
| `--custom-chat-entry-padding-inline`     | Existing chat padding     | Horizontal padding within each feed entry                                         |
| `--custom-chat-question-max-width`       | Existing fullscreen limit | Maximum question width on wide fullscreen layouts                                 |
| `--custom-chat-answer-max-width`         | Existing answer limit     | Maximum answer width within a feed entry                                          |
| `--custom-width-entries-container`       | `auto`                    | Conversation feed width                                                           |
| `--custom-max-width-entries-container`   | `100%`                    | Responsive conversation feed width limit                                          |
| `--custom-margin-side-entries-container` | `0`                       | Set to `auto` to centre the conversation feed                                     |
| `--custom-input-container-box-sizing`    | `content-box`             | Set to `border-box` to include composer wrapper padding in its configured width   |
| `--custom-padding-side-input-container`  | Existing chat padding     | Horizontal padding around the composer                                            |

The search/submit icon is controlled separately by the existing `displaySearchButton`
configuration option. Without that button, Enter submits a question; modified Enter
keeps the existing multiline behavior.

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
