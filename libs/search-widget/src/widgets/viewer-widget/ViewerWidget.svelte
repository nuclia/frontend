<svelte:options customElement="nuclia-viewer" />

<script lang="ts">
  import {
    getFieldType,
    getResourceById,
    getResourceField,
    getResultType,
    initNuclia,
    initViewer,
    isPreviewing,
    loadFonts,
    loadSvgSprite,
    resetNuclia,
    setCDN,
    setLang,
    viewerData,
    type WidgetAction,
    widgetActions,
    widgetFeatures,
  } from '../../core';
  import type { TypedResult } from '../../core';
  import { onMount } from 'svelte';
  import type { FieldFullId, KBStates, Widget } from '@nuclia/core';
  import { ResourceProperties } from '@nuclia/core';
  import globalCss from '../../common/_global.scss?inline';
  import { BehaviorSubject, filter, firstValueFrom, forkJoin, Observable } from 'rxjs';
  import { onClosePreview, Viewer } from '../../components';
  import { injectCustomCss } from '../../core/utils';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = '';
  export let knowledgebox = '';
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let features = '';
  export let standalone = false;
  export let proxy = false;
  export let cssPath = '';
  export let no_tracking = false;

  export let rid = '';
  export let field_id = '';
  export let field_type = '';

  $: fieldType = getFieldType(field_type);
  $: if (rid && field_id && fieldType) {
    const fullId = {
      resourceId: rid,
      field_id,
      field_type: fieldType,
    };
    openPreview(fullId);
  } else {
    closePreview();
  }

  widgetActions.set([]);
  export function setViewerMenu(actions: WidgetAction[]) {
    widgetActions.set(actions);
  }

  export function openPreview(fullId: FieldFullId): Observable<boolean> {
    forkJoin([
      getResourceById(fullId.resourceId, [ResourceProperties.BASIC, ResourceProperties.VALUES]),
      getResourceField(fullId),
    ]).subscribe(([resource, fieldData]) => {
      const field = { field_id: fullId.field_id, field_type: fullId.field_type };
      const { resultType, resultIcon } = getResultType({ ...resource, field, fieldData });
      const result: TypedResult = {
        ...resource,
        field,
        resultType,
        resultIcon,
      };
      viewerData.set({
        result,
        selectedParagraphIndex: -1,
      });
    });

    return isPreviewing;
  }

  export function closePreview() {
    onClosePreview();
  }

  export const reset = () => resetNuclia();

  let _ready = new BehaviorSubject(false);
  const ready = _ready.asObservable().pipe(filter((r) => r));
  export const onReady = () => firstValueFrom(ready);

  let svgSprite;
  let container: HTMLElement;
  let _features: Widget.WidgetFeatures = {};

  onMount(() => {
    if (cdn) {
      setCDN(cdn);
    }

    _features = (features ? features.split(',').filter((feature) => !!feature) : []).reduce(
      (acc, current) => ({ ...acc, [current as keyof Widget.WidgetFeatures]: true }),
      {},
    );
    widgetFeatures.set(_features);

    initNuclia(
      {
        backend,
        zone,
        knowledgeBox: knowledgebox,
        client,
        apiKey: apikey,
        account,
        accountId: account,
        standalone,
        proxy,
      },
      state,
      {},
      no_tracking,
    );

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
    initViewer();
    injectCustomCss(cssPath, container);

    _ready.next(true);

    return () => reset();
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div
  bind:this={container}
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $ready && !!svgSprite}
    <Viewer />
  {/if}

  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style
  lang="scss"
  src="./ViewerWidget.scss"></style>
