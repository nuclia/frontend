<svelte:options
  customElement={{
    tag: 'nuclia-viewer',
    props: {
      kbstate: { attribute: 'state' },
    },
  }}
  accessors />

<script lang="ts">
  import type { FieldFullId, KBStates, Widget } from '@nuclia/core';
  import { ResourceProperties } from '@nuclia/core';
  import { BehaviorSubject, filter, firstValueFrom, forkJoin, Observable } from 'rxjs';
  import { createEventDispatcher, onMount } from 'svelte';
  import globalCss from '../../common/global.css?inline';
  import { onClosePreview, Viewer } from '../../components';
  import type { TypedResult } from '../../core';
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
  import { injectCustomCss } from '../../core/utils';

  interface Props {
    backend?: string;
    zone?: string;
    knowledgebox?: string;
    lang?: string;
    cdn?: string;
    apikey?: string;
    account?: string;
    client?: string;
    kbstate?: KBStates;
    features?: string;
    standalone?: boolean;
    proxy?: boolean;
    csspath?: string;
    no_tracking?: boolean;
    rid?: string;
    field_id?: string;
    field_type?: string;
  }

  let {
    backend = 'https://nuclia.cloud/api',
    zone = '',
    knowledgebox = '',
    lang = $bindable(''),
    cdn = '',
    apikey = '',
    account = '',
    client = 'widget',
    kbstate = 'PUBLISHED',
    features = '',
    standalone = false,
    proxy = false,
    csspath = '',
    no_tracking = false,
    rid = '',
    field_id = '',
    field_type = '',
  }: Props = $props();

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

  let svgSprite = $state();
  let container: HTMLElement = $state();
  let _features: Widget.WidgetFeatures = {};

  const dispatch = createEventDispatcher();
  const dispatchCustomEvent = (name: string, detail: any) => {
    dispatch(name, detail);
  };

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
      kbstate,
      {},
      no_tracking,
    );

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
    initViewer(dispatchCustomEvent);
    injectCustomCss(csspath, container);

    _ready.next(true);

    return () => reset();
  });
  let fieldType = $derived(getFieldType(field_type));
  $effect(() => {
    if (rid && field_id && fieldType) {
      const fullId = {
        resourceId: rid,
        field_id,
        field_type: fieldType,
      };
      openPreview(fullId).subscribe();
    } else {
      closePreview();
    }
  });
</script>

<svelte:element this={'style'}>{@html globalCss}</svelte:element>

<div
  bind:this={container}
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  <style src="../../common/common-style.css"></style>
  {#if $ready && !!svgSprite}
    <Viewer />
  {/if}

  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>
