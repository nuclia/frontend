# 1.23.1 (unreleased)

### Improvements

- Support generated questions and answers:
  - Add `question_answers` property to `ExtractedData` interface
  - Add `QUESTION_ANSWERS` type to `ExtractedDataTypes`
  - `getFullResource` and `getFullResourceBySlug` methods now also retrieve generated questions and answers
- Support the `conversation` RAG strategy

### Bug fix

- Correct the data returned by `getKnowledgeBox` and `createKnowledgeBox` methods in standalone mode

# 1.23.0 (2024-11-26)

### Improvement

- Support `citation_threshold` on `/ask` endpoint
- Update `queryRemiScores` method to support pagination and filtering by answer feedback
- Support new endpoints to download activity log data
- Updated `feedback` method to allow feedback on specific text blocks
- Add `entities` property to `FieldMetadata` interface
- Deprecate `extracted` parameter from `/search`, `/find` and `/ask` endpoints
- Support prequeries results in `/ask` endpoint

### Breaking changes

- Remove support for old activity log endpoints: `/feedback`, `/activity/download` and `activity/downloads`
- Remove `PARAGRAPH/S`, `VECTOR/S` and `DOCUMENT` values from `Search.Features` and `Ask.Features` enums

# 1.22.0 (2024-10-14)

### Beta feature

- KB Task management

### Improvement

- Support `keyword_filters` on `/ask` and `/find` endpoints
- Fix: do not override `show` parameter when calling `ask()`
- Support `debug` parameter on `/ask` endpoint
- Add `metadata` and `promptContext` to `Ask.Answer` model
- Add support for hidden resources
- Add support for rephrase prompt
- Support `reranker` on `/ask` and `/find` endpoints

### Deprecation

- The `page_number` and `page_size` parameters are deprecated for `/search`, `/find` and `/ask` endpoints. `top_k` should be used instead.

# 1.21.1 (2024-09-12)

### Improvement

- Update `RemiQueryCriteria` model allowing now to query either on `context_relevance` or on answer `status`.
- Update `RemiQueryResponseItem` as REMi score is actually optional
- Remove Algolia mappers
- Refactor `getUsers` to call only KB users endpoint now it returns all the information we need

### Bug fix

- Return `IErrorResponse` when ask request is successful but its response contains an error

# 1.21.0 (2024-09-05)

### Feature

- Support the `prequeries` RAG strategy on `/ask` endpoint

### Improvement

- Support input/output max tokens on `/ask` endpoint
- Add support for `neighbouring_paragraphs` RAG strategy

# 1.20.0 (2024-09-02)

### Feature

- Add `activityMonitor` property to `IWritableKnowledgeBox`, which allows to request REMi metrics on the Knowledge Box
- Support `top_k` on `/ask` endpoint

### Improvement

- Update `UsageAggregation` type to match the backend one

# 1.19.3 (2024-08-27)

### Improvement

- Add `vectorset` option to Search
- Add `search_configs` property to `IKnowledgeBoxCreation` interface
- Update `ChatOptions` model to support passing a system prompt to `/ask` endpoint
- Support `user_context` on `rephrase()`

# 1.19.2 (2024-08-19)

### Bug fix

- Fix RAG pipeline variable replacement

# 1.19.1 (2024-08-14)

### Bug fix

- Remove wrong `exports` path in package.json

# 1.19.0 (2024-08-14)

### Beta feature

- Advanced agentic RAG pipeline support

### Bug fix

- KB invitation deletion: encode email before sending it as URL parameter

# 1.18.0 (2024-07-25)

### Breaking changes

- Remove support for entity management
- Remove support for entity annotation

### Improvements

- Create interface for `LearningConfigurationSchema` properties field: `LearningConfigurationProperty`
- Update `LearningConfigurationProperty` with options used in Hugging Face schema: `default` and `description`
- Add new value aliases to `Search.Features` and `Ask.Features` enums:
  - `KEYWORD` alias for `PARAGRAPH/PARAGRAPHS`
  - `SEMANTIC` alias for `VECTOR/VECTORS`
  - `FULLTEXT` alias for `DOCUMENT`
  - Original values are marked as deprecated
- Support `extra_context` on `/ask`

# 1.17.1 (2024-07-08)

### Deprecation

- Annotation related methods are deprecated and will be removed in next minor version:
  - entity management
  - synonyms management

### Beta feature

- Support `answer_json_schema` in `/ask` endpoint

# 1.17.0 (2024-07-02)

### Breaking changes

- Remove support for visual selection labelling
- Remove support for `keywordset`, `datetime` and `layout` field types

### Improvements

- Add HTTP headers to the `lastQuery` events
- Add support for `prefer_markdown` option on `/ask` endpoint

# 1.16.0 (2024-05-29)

### Breaking changes

- `getResource` and `getResourceBySlug` only retrieve basic metadata by default.
- Remove `/chat` support (deprecated) and use `/ask` instead.

### Improvements

- Add `nested_list_position` in `FileExtractedData` model
- `getFullResource` and `getFullResourceBySlug` methods to retrieve all the metadata of a resource

# 1.15.0 (2024-05-17)

### Breaking changes

- Remove methods using deprecated `/stats` endpoint and remove corresponding models.
- Rename `Chat` namespace to `Ask`.
- Rename the existing `.ask()` method in `Resource` to `.askToResource()`
- Rename `.chat()` method in `KnowledgeBox` and in `Resource` to `.ask()`

### Improvements

- Update `Citations` model
- Add `KEEP_MARKDOWN` format to `TextFormat` type
- Add `creation_date` in Account model
- Support the new `ask` endpoint

# 1.14.9 (2024-04-30)

### Bug fix

- Do not refresh auth tokens if there is no refresh token

# 1.14.8 (2024-04-29)

### Improvements

- Improve HTTP 429 errors handling on resource modification and deletion
- Support `max_tokens` on `/chat` endpoint

### Bug fix

- Prevent `normalizeSchemaProperty` to crash when the `LearningConfigurations` contains null values.

# 1.14.7 (2024-04-19)

### Improvements

- `ask()` method in the resource, it allows to ask questions to the resource using the entire content of the resource as context
- Remove `inTitleOnly` search option
- Add new `/usage` endpoint and add deprecation note on previous `/stats` endpoint

# 1.14.6 (2024-04-12)

### Improvements

- Improve reliability of file uploads
- Add `maxWaitOn429` parameter to `uploadFile` and `TUSuploadFile` methods
- Add `limitExceeded` field to file upload status
- Method to dump all the last logged events (last query, last results, etc.) and download it as JSON file

# 1.14.5 (2024-04-08)

### Improvements

- Support security groups when creating a resource.

# 1.14.4 (2024-04-05)

### Improvements

- Support the `/predict/query` endpoint
- Add support for `xpath` selector in Link fields

# 1.14.3 (2024-03-38)

### Improvements

- Knowledge Box `title` and `slug` are required fields in `IKnowledgeBoxCreation` model
- Adding optional `allowed_origins` field in `IKnowledgeBoxCreation` model
- Improve reliability of resource creation and modification
- Update `getParagraphText`, `getSentenceText` and `getDataKeyFromFieldType` methods to support conversation fields
- Support rephrase feature and add more RAG strategies

# 1.14.2 (2024-03-15)

### Improvements

- Allow to check authorization on endpoints

# 1.14.1 (2024-03-14)

### Improvements

- Support POST requests for `/catalog` endpoint
- Update `Entities` interface as `getEntities` no longer returns the `entities` property

# 1.14.0 (2024-03-12)

### Improvements

- Allow to modify the HTTP headers in the Nuclia REST API calls.
- Add support for `css_selector` in Link fields

### Breaking changes

- Remove deprecated method `getProcessingStatus` from `db` as the backend is not supporting it anymore

# 1.13.0 (2024-03-05)

### Breaking changes

- Remove `withEntities` parameter from `getEntities` method. Now `getEntities` does not return the list of entities in any case.

### Improvements

- Fix retry configuration in `uploadFile` and `TUSuploadFile` methods
- Add `listFeedback` method for retrieving user feedback
- Allow to pass LLM to `/chat` and `/summarize` endpoints
- Add `marketplace` endpoints to global API
- Add account invitation management endpoints and models:
  - `getAccountInvitations` allows to list all pending invitations
  - `deleteAccountInvitation` allows to delete a pending invitation
- Update `inviteToAccount` payload which can now take an optional role

# 1.12.0 (2024-02-22)

### Breaking changes

- `getLearningConfigurations` is now replaced by `getLearningSchema` method which is requiring account id and zone for Cloud accounts.

### Improvements

- New `getLearningSchema` method in KB (do the same as db’s `getLearningConfigurations`, as KB endpoint is proxying db one internally).

# 1.11.8 (2024-02-21)

### Improvements

- Support `all`, `any`, `none` and `not_all` operators in `filters` parameter

# 1.11.7 (2024-02-15)

### Improvements

- Improve reliability of `summarize` and `predictSummarize` methods
- Add logs on error in Rest methods.

# 1.11.6 (2024-02-06)

### Bugfix

- Fix the error management in rest’s `getStreamMessages` method:
  - firefox is raising `NS_BINDING_ABORTED` TypeError when reloading the page while the connection is opened, so our system allowing to reconnect once in case of network error was reconnecting while it shouldn't have on this specific case.
  - we now prevent the observer to complete with an error when calling `stopListeningToNotifications`
  - better error message when fetch is raising an error

### Improvements

- Add `AI_TOKENS_USED` to `StatsType` enum.

# 1.11.5 (2024-02-05)

### Improvements

- Add `listenToResourceOperationNotifications` method which is sending notifications about resource creation, modification and deletion.
- Update `listenToProcessingNotifications` documentation to clarify that notifications are sent anytime processing is done, which occurs for both resource creation and modification.

# 1.11.4 (2024-02-05)

### Improvements

- Add `resource_title` to `BaseNotificationData` model
- Create an interface for `listenToProcessingNotifications` response (`ResourceProcessingNotification`) including the resource title and a timestamp
- Improve `getStreamMessages`: reconnect if the connection is lost and there was no error for the last 10s

# 1.11.3 (2024-02-01)

### Improvements

- Support Knowledge Box notification endpoint
- Add support for new `/processing-status` endpoint in `kb.ts`, add `@deprecated` mark to `getProcessingStatus` method from `db.ts`.
- Support endpoints for retrieving and deleting existing invitations to a kb
- Support security fields in `Resource`
- Support RAG strategies options in `/chat` endpoint

# 1.11.2 (2024-01-25)

### Improvements

- Add SAML related properties to `Account` interface
- Add `AccountModification` interface
- Support `origin.path` metadata in `Resource` model

# 1.11.1 (2024-01-22)

### Improvements

- Let pass extra metadata at resource creation time.

# 1.11.0 (2024-01-22)

### Breaking changes

- The `/suggest`endpoint now returns the family of each suggested entity

### Improvements

- Update `LearningConfiguration` model
- Remove `hideSources` option from `WidgetFeatures`
- Add `hideResults` option to `WidgetFeatures`
- Support `/predict/summary` endpoint
- Support the `user_prompt` parameter in Knowledge Box `/summarize` endpoint

# 1.10.0 (2024-01-08)

### Breaking changes

- Account slug is replaced by account id in several methods’ signature, and zone is required (except when using local NucliaDB instance):
  - getKnowledgeBox
  - createKnowledgeBox
  - getNUAClients
  - getNUAClient
  - createNUAClient
  - renewNUAClient
  - deleteNUAClient

### Improvements

- Add `v3starter`, `v3fly`, `v3growth` and `v3enterprise` to `AccountTypes`
- Support `/rephrase` endpoint in KnowledgeBox
- Add `generateRandomQuestionAboutResource` method
- Add `index_size` in `Counters` model
- Don't crash on `getToken` when local storage is disabled on the browser

# 1.9.1 (2023-12-18)

### Improvements

- `/ephemeral_tokens` endpoint can now be called using regional domain
- Support `summarize` operation on resources
- Remove `onlyAnswers` property from `WidgetFeatures` interface, only answers is now managed by `hideSources` option.
- Support the `citation` option on `/chat` endpoint

### Bugfix

- In regional system, automatically set the zone slug in nua client returned by `getNUAClients`

# 1.9.0 (2023-11-22)

### Breaking changes

- All `/activity` endpoints are using regional domain now. In those endpoints, all regional account references should be done by id instead of slug.
- `getNUAActivity` method now requires the NUA client zone slug

### Improvements

- Support `proxy` option in `Nuclia` class to allow calling the Nuclia regional API through a proxy
- Use filter alias syntax in filter utility functions.
- Support `/predict/chat` endpoint
- Experimental option in chat to restrict results to the ones that have been effectively used to generate the answer

# 1.8.0 (2023-11-10)

### Features

- Add account user management methods in `db`:
  - getAccountUser: get an account user by their id
  - getAccountUsers: get the list of all users of an account
  - setAccountUsers: add and/or delete users from an account
  - inviteToAccount: invite a user to an account
- Add Knowledge Box user management methods in `kb`:
  - getUsers: get the list of Knowledge Box users
  - updateUsers: update the list of Knowledge Box users
  - inviteToKb: invite a user to the Knowledge Box

### Improvements

- Add `allow_kb_management` property to `NUAClientPayload`
- Add optional `zoneSlug` parameter to `getFullUrl`, `fetch`, `get`, `post`, `put` and `delete` methods.
- Add `LearningConfigurationOption` interface
- Add support for regional Knowledge Boxes
  - new `getKbIndexes` method in `db` allowing to list of the KB index of an account
  - update `getKnowledgeBoxes`, `getKnowledgeBox`, `createKnowledgeBox`, `WritableKnowledgeBox.modify` and `WritableKnowledgeBox.delete` methods for supporting regional endpoints when the flag `NUCLIA_NEW_REGIONAL_ENDPOINTS` is enabled
  - add `getKnowledgeBoxesForZone` method listing all the KBs for an account and a zone
  - support regional Knowledge Boxes on user management methods

# 1.7.0 (2023-10-19)

### Breaking changes

- The `/chat` endpoint needs `vectors` to be mentioned explicitly in its `features` parameter.

# 1.6.5 (2023-10-19)

### Bug fix

- Prevent `/chat` endpoint to be called twice when using `chat` method with a callback.

# 1.6.4 (2023-10-17)

### Improvements

- Update `BlockedFeature` model to match backend one
- Improve maintainability of `AccountLimits` and `AccountLimitsPatchPayload` using better typing construction
- `getTempToken` method optimizes token usage by caching previously generated tokens

### Bug fix

- Fix typing of `chat`’s `options` parameter
- Fix ability to use `chat` method with `asyncKnowledgeBox` by adding an overload signature taking a callback parameter

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
