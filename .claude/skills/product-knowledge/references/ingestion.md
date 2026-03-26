# Ingestion Reference

_Source: `../docs/docs/ingestion/`_

---

## Ingestion Methods

| Method                                | Best for                                                              |
| ------------------------------------- | --------------------------------------------------------------------- |
| REST API / Python SDK / JS SDK        | Automated / repeatable ingestion                                      |
| Agentic RAG Dashboard (upload / sync) | One-time or manual ingestion                                          |
| CLI (`nuclia` command)                | Scripted one-time ingestion                                           |
| Sync Agent                            | Continuous watch of external sources (Google Drive, SharePoint, etc.) |

**Regions:** Europe or USA. Chosen at KB creation time. Storage limits vary by account tier.

**Updatable resources:** Use `slug` to assign a stable identifier so you can GET/PATCH/DELETE by slug later:

```
PATCH /api/v1/kb/{kbid}/slug/{rslug}
```

---

## Supported Data Types

### Text formats (inline)

`PLAIN`, `HTML`, `MARKDOWN` (converted to plain text), `KEEP_MARKDOWN`, `RST`, `JSON`, `JSONL`

### File formats

- **Documents:** `.txt`, `.html`, `.docx`, `.pdf`, `.json`, more
- **Spreadsheets:** `.xlsx`, `.csv`
- **Presentations:** `.pptx`
- **Images:** `.jpg`, `.png`, `.tiff` (OCR applied automatically)
- **Video:** `.mp4`, `.avi`, `.mpeg` (speech-to-text applied)
- **Audio:** `.mp3`, `.wav` (speech-to-text applied)
- **Archives:** `.zip`, `.gzip`, `.rar` — contents indexed as **one resource** (split before upload if separate results needed)
- Full list: Apache Tika supported formats

### Web pages

Ingest via URL (HTML only). Use `LinkField.css_selector` to exclude headers/footers/noise.

### Conversations

List of messages with timestamp, author, optional attachments.

---

## Indexing

### Unstructured text

Automatic OCR for images, speech-to-text for audio/video. The extracted text is what gets indexed.

### Structured text (tables, JSON, CSV)

- Simple JSON/CSV with explicit column names: works well semantically.
- Complex tables (50+ columns, unclear attribute names): better to index as separate text resources.
- Enable **"Interpret tables"** (dashboard), `--interpretTables` (CLI), `interpretTables=True` (SDK), or append `+aitable` to `mimetype` in the API.

### Metadata types

| Type                               | Filterable                               | Notes                             |
| ---------------------------------- | ---------------------------------------- | --------------------------------- |
| `icon` (mimetype)                  | ✓                                        | Auto-extracted                    |
| `origin` (URL, author, tags, path) | ✓ (partial path match for `origin.path`) | User-provided                     |
| Labels / entities                  | ✓                                        | User or auto-generated            |
| `extra` metadata                   | ✗                                        | Free-form, not indexed for search |

---

## Extract Strategies

Reusable configurations controlling how data is extracted from documents.

### Visual Extraction

- Uses a visual LLM to understand page layout.
- Must select a **visual** LLM (e.g., `chatgpt-azure-4o`).
- Configure `rules` in natural language: "Extract text ignoring headers/footers", "Describe images as electronics expert".
- All pages processed using the visual model.

### AI Tables

- Detects tables in documents, extracts them as Markdown using an LLM.
- Only table-containing pages processed.
- Parameters: `llm`, `rules`, `merge_pages`, `max_pages_to_merge`.
- Can be combined with Visual Extraction for complex visual tables.

### Management

- Created via Dashboard (AI Models → Extract & split), CLI (`nuclia kb extract_strategies add`), or SDK.
- Once created, **cannot be modified** — delete and recreate.
- Applied per-upload via `extract_strategy` ID parameter.

---

## Split Strategies

Reusable configurations controlling how content is chunked.

### Manual Splitting

- Splits on a delimiter (default: `"\n\n"`).
- Config: `"custom_split": 1`, `"manual_split": {"splitter": "\n"}`.

### LLM Splitting

- Uses an LLM for context-aware chunking.
- Config: `"custom_split": 2`, `"llm_split": {"llm": {"generative_model": "..."}, "rules": [...]}`.
- Increases processing time/cost; may slightly alter text.

### Management

- Same lifecycle as extract strategies (create, list, delete — no update).
- Applied per-upload via `split_strategy` ID parameter.

---

## Data Augmentation Agents

Automated post-ingestion agents that enrich resources. Run as one-shot or continuously on new resources. Can be filtered by resource/field type or keywords. Can trigger webhooks.

| Agent type          | What it does                                                                          |
| ------------------- | ------------------------------------------------------------------------------------- |
| **Labeler**         | Classifies resources into user-defined labelsets using label descriptions             |
| **Generator**       | Generates text fields (summaries, JSON outputs, structured extraction) from resources |
| **Q&A Generator**   | Generates question/answer pairs from resource content                                 |
| **Graph Extractor** | Extracts named entities and relations; define entity types + examples                 |

**Graph Extractor note:** If entities span multiple text blocks, use a Generator first to phrase relations explicitly, then run the Graph Extractor on those generated fields.

Managed from: KB → _Agents_ in left menu. API: `/docs/nua-api#tag/Task`.

---

## Ingestion Best Practices

1. **Avoid noise:** Strip headers/footers (`css_selector`), don't index video transcripts separately (already extracted), don't index multi-language duplicates.
2. **Use slugs for updatable data:** Enables idempotent upsert pattern.
3. **Use `origin.path` for hierarchical sources:** Prefix-match filtering enables folder-level scoping.
4. **Use `usermetadata.classifications` for custom labels:** Filtersets queries efficiently.
5. **Use `security.access_groups` for group-based access filtering** (not enforcement — works on intersection).
6. **Archives:** Only use if you want results grouped; otherwise extract files first.
