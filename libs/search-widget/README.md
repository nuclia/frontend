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
| `--custom-chat-input-align-items`        | `flex-start`              | Vertical alignment of the textarea and composer actions                           |
| `--custom-chat-buttons-align-self`       | `auto`                    | Vertical alignment of composer actions                                            |
| `--custom-chat-buttons-margin`           | `0 var(--rhythm-1)`       | Space around composer actions                                                     |
| `--custom-chat-buttons-flex-shrink`      | `1`                       | Set to `0` to prevent composer actions shrinking                                  |
| `--custom-textarea-min-width`            | `auto`                    | Set to `0` to allow the textarea to shrink within a flex row                      |
| `--custom-chat-container-min-width`      | `auto`                    | Set to `0` to allow the chat container to shrink                                  |
| `--custom-chat-entries-box-sizing`       | `content-box`             | Set to `border-box` to include feed padding in its configured width               |
| `--custom-chat-question-min-width`       | `auto`                    | Set to `0` to allow question text to shrink and wrap                              |
| `--custom-chat-question-icon-flex`       | `0 1 auto`                | Set to `0 0 auto` to preserve the question icon width                             |
| `--custom-textarea-white-space`          | `preserve`                | Sizing mirror wrapping; use `pre-wrap` for multiline growth                       |
| `--custom-textarea-overflow-wrap`        | `normal`                  | Long-word wrapping in the textarea and sizing mirror                              |
| `--custom-textarea-margin`               | Existing vertical margin  | Textarea and sizing mirror margin                                                 |
| `--custom-chat-message-overflow-wrap`    | `normal`                  | Long-word wrapping in questions and answers                                       |
| `--custom-chat-question-white-space`     | `normal`                  | Set to `pre-wrap` to preserve question line breaks                                |
| `--custom-chat-entry-padding-inline`     | Existing chat padding     | Horizontal padding within each feed entry                                         |
| `--custom-chat-question-max-width`       | Existing fullscreen limit | Maximum question width on wide fullscreen layouts                                 |
| `--custom-chat-answer-max-width`         | Existing answer limit     | Maximum answer width within a feed entry                                          |
| `--custom-width-entries-container`       | `auto`                    | Conversation feed width                                                           |
| `--custom-max-width-entries-container`   | `none`                    | Responsive conversation feed width limit                                          |
| `--custom-margin-side-entries-container` | `0`                       | Set to `auto` to centre the conversation feed                                     |
| `--custom-input-container-box-sizing`    | `content-box`             | Set to `border-box` to include composer wrapper padding in its configured width   |
| `--custom-padding-side-input-container`  | Existing chat padding     | Horizontal padding around the composer                                            |

The search/submit icon is controlled separately by the existing `displaySearchButton`
configuration option. Without the opt-in feature below, submission behavior is unchanged.

Add the opt-in `chatSubmitButton` feature (or set `chatSubmitButton: true` in widget
configuration) alongside `displaySearchButton` for the standard small, solid primary
icon button with an up arrow. Other chat widgets retain their basic search icon button.
This feature also disables submission while the composer is disabled or contains only
whitespace, and prevents Enter submission during IME composition. Modified Enter retains
the existing multiline behavior.
The variant uses the existing button's hover, pressed, focus-visible and disabled states;
its primary palette can be themed through the existing `--custom-color-primary-*` properties.

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
