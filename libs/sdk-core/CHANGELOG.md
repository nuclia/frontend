# 1.1.4 (2023-03-01)

### Improvements

- Add `fieldData` to `Search.SmartResult`
- Add `fields` in `SearchOptions`
- Add `ResourceFieldProperties` enum in kb models
- Add `show` and `extracted` params to `getField` method in `Resource`
- Add `origin` param to `createLinkResource`

# 1.1.3 (2023-02-08)

### Improvements

- Update `Relation` interface
- Add `Search.Relations`and `Search.Relation` interfaces
- Add `EntityPositions` interface to resource models
- Create `UserTokenAnnotation` interface which adds `cancelled_by_user` property, and use it instead of `TokenAnnotation` in `UserFieldMetadata`
- Fix `getAnnotatedEntities` method to filter out `cancelled_by_user` annotations from the list.
- Rename interface `ParagraphAnnotation` to `ParagraphClassification` to avoid confusion
- Update training types: labeler split in two `resoure-labeler` and `paragraph-labeler`
- Add `field` property to `Search.SmartResult` interface
- Add support for `/train/executions` endpoint
- Add `SHORT_FIELD_TYPE` enum in search models and update `Paragraph` and `Sentence` interfaces accordingly
- Add mappers to translate `SHORT_FIELD_TYPE` into `FIELD_TYPE` and _vice versa_
- Add mapper `getDataKeyFromFieldType` to translate `FIELD_TYPE` into key of `ResourceData`
- Don't load entities by default when loading entity families, add `withEntities` parameter to `getEntities` method to load entities as well
- Add the `/catalog` endpoint

# 1.1.2 (2023-01-20)

### Bugfix

- Remove the sentence labelset type

### Improvements

- Add `filename` and `md5` in `CloudLink` model
- Add `updateField` method on resource
- Allow to get suggestions based on title only
- Sort option on search is now an object. Add corresponding `SortOption` interface and `SortOrder` type in our model.

# 1.1.1 (2023-01-03)

### Improvements

- Add pagination model in search results
- Add `computedmetadata` to `IResource` model
- Add support for NER training
- Add method to test if a trained model is available
- Add `TextFieldFormat` type
- Add `importDataset` method to `WritableKnowledgeBox`
- Add `ResourceStatus` type
- Add `with_status` search option
- Fix `FacetsResult` model
- Store shard ids according their kb

### Bugfix

- Don't parse the body of a post request when `specialContentType` is set, even if special `content-type` is set to `application/json`

# 1.1.0 (2022-12-08)

### Breaking change

- Remove widget endpoints: the widget is not stored in the backend anymore

### Improvements

- Fix resource data if null
- Add `getLabelFromFilter` and `getFilterFromLabel` functions
- Add NUA key to the local storage only when the key is created from the desktop application
- Update `/processing/status` endpoint response model
- Update `getParagraphText` and `getSentenceText` methods to improve performance
- Do not return cancelled classifications in `getClassifications`
- Use POST by default for `/search` endpoint and fix search results model

# 1.0.6 (2022-11-17)

- aggregate user-assigned labels and ML-assigned labels
- use `Classification` instead of `LabelValue`
- add `WidgetFeatures` interface
- provide Unicode-compliant string functions

# 1.0.5 (2022-11-08)

- `x-filename` must not be base64 encoded anymore
- add `createOrModify` and `hasResource` methods

# 1.0.4 (2022-11-03)

- Support "by slug" resource endpoints

# 1.0.3 (2022-10-31)

- Add sub-folders in `db`
- Add missing exports in index.ts
- Add method `getProcessingStats` allowing to get stats for resources pending to be processed
- Add enum `StatsRange` to be used with `/processing/stats` endpoint
- Update `StatsType` enumeration to be aligned with what's supported by the API

# 1.0.2 (2022-10-19)

- Support external file uploading
- Do not persist shards in localStorage

# 1.0.1 (2022-10-06)

- Fix stash persistence
- Allow to get annotated entities

# 1.0.0 (2022-10-04)

- First stable release
