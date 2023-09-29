# 1.6.3 (2023-10-02)

### Improvements

- Add synchronous option to `/chat` endpoint, allowing to get the response as a JSON instead of a stream
- Add synchronous option to delete field method

# 1.6.2 (2023-09-11)

### Improvements

- Fix circular dependencies in db models
- Add `inError` in Chat.Answer model

# 1.6.1 (2023-08-22)

### Improvements

- Add `stash-starter` and `stash-growth` to `AccountTypes`
- `getTempToken` method can now be used without providing `account` and `kbSlug` options to `Nuclia` class
- `/activity/download` and `/activity/downloads` endpoints now use regional backend
- Add `widget` property to `LearningConfigurationSchemas` interface
- Support ephemeral tokens on NucliaDB standalone
- Add entity suggestions support on suggest endpoint
- Add `suggestEntities` and `displayMetadata` to `WidgetFeatures` interface

# 1.6.0 (2023-07-25)

### Breaking changes

- Remove `advanced_query` support on search endpoints

### Improvements

- Add support for `/activity/download` and `/activity/downloads` endpoints
- Move `highlight` option from `SearchOptions` to `BaseSearchOptions`

# 1.5.0 (2023-07-18)

### Breaking changes

- Remove `Search.SmartParagraph` interface as it's not used anymore
- Rename `Search.SmartResult` interface to `Search.FieldResult` as `Smart` prefix doesn't make sense anymore
- Load `SHORTENED_METADATA` by default on `getField`

### Improvements

- Add `SHORTENED_METADATA` type to `ExtractedDataTypes`
- Add `selections` in field metadata
- Update Learning configurations models
  - Update `LearningConfiguration` interface
  - Add `LearningConfigurationSchemas` and `LearningConfigurationSchema` interfaces
- Add `resource_filters` property to `BaseSearchOptions`
- Add `find` method to `resource` class

### Bug fix

- Add missing `generic` type in `shortToLongFieldType` and `getFieldTypeFromString` mappers

# 1.4.0 (2023-06-23)

### Breaking change

- `setField` method replaces `addField` and `updateField` which were identical.
- Manage errors on chat endpoint:
  - `KnowledgeBox.chat` method returns `IErrorResponse` on error
  - Add `type` property to `FindResults` model

### Improvements

- Add `getEntityFromFilter` and `getFilterFromEntity` functions
- Add `autofilters` property to `FindResults` model
- Add `events` and emit API errors and partial search results in `events`
- Chat now returns `relations` when available

# 1.3.4 (2023-06-13)

### Improvements

- Add `autofilter` property to `BaseSearchOptions` and `WidgetFeatures` models
- Manage properly 206 status (partial results) on find endpoint:
  - Add optional `body` property on `IErrorResponse`
  - Return an `IErrorResponse` with results in `body` when response status is 206

### Bugfix

- Prevent content-type to be set to "null" during upload

# 1.3.3 (2023-06-06)

### Improvements

- Update `AccountLimits` model and create `AccountLimitsPatchPayload` model
- Add `extra` metadata property in Resource model
- Add `EXTRA` value in `ResourceProperties` enum, allowing to get extra property when loading resource

# 1.3.2 (2023-05-24)

### Improvements

- Add `trial_expiration_date` property to `Account` model
- Update `modifyKb` to also work on standalone mode
- Add `onlyAnswers` property to `WidgetFeatures` interface
- Add `generic` field type
- Add models for conversations fields

### Bugfix

- Fix `knowledgeBox` getter on `Nuclia` object to work without zone when on standalone mode.

# 1.3.1 (2023-05-02)

### Improvements

- Add `title` and `color` properties to `UpdateEntitiesGroupPayload` model
- Update `Account` and `AccountLimits` models
- Create `AccountBlockingState` and `BlockedFeature` models for the new `blocking_state` and `blocked_features` properties in `Account`
- Support `predict/tokens` endpoint

# 1.3.0 (2023-04-18)

### Breaking changes

- Rename `setEntitiesGroup` into `createEntitiesGroup` and call the new POST `/kb/{kbid}/entitiesgroups` endpoint replacing deprecated POST to `/kb/{kbid}/entitiesgroups/{group}`
- Add method `updateEntitiesGroup` allowing to PATCH existing entity groups using the new `UpdateEntitiesGroupPayload` payload.

### Improvements

- Add `navigateToFile` property to `WidgetFeatures` interface
- Explicit `FacetsResult` type: replace `any` by the actual object type

# 1.2.1 (2023-04-07)

### Improvements

- Support Kb configuration endpoints
- Add `error` property in `IFieldData` and corresponding `IError` interface
- catch error and return an empty label set on `kb.getLabels` method
- Add common `IErrorResponse` interface
- Better error management for search, find, catalog and suggest endpoints

# 1.2.0 (2023-03-28)

### Features

- `/find` endpoint support
- `/chat` endpoint support
- `/feedback` endpoint support

### Improvements

- New endpoints for synonyms management on KnowledgeBox
- New account types
- Add enum `SortField` for `SortOption`'s field.

# 1.1.6 (2023-03-20)

### Improvements

- Add learning configuration in KB creation
- Fix compiling errors about index signature
- Add `getStandaloneKbs` method in db
- Update `getKnowledgeBox` to also work on standalone mode
- Add optional `uuid` in KnowledgeBox model
- Update `getAuthHeaders` to automatically add the required `X-NUCLIADB-ROLES` depending on the method and the path

# 1.1.5 (2023-03-03)

### Improvements

- Add `FieldFullId` interface to `resource.models`

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
