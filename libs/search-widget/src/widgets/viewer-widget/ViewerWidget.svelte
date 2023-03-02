<svelte:options tag="nuclia-viewer" />

<script lang="ts">
  import { getResourceById, getResourceField, initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { setCDN, loadFonts, loadSvgSprite, getFieldType } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import type { KBStates } from '@nuclia/core';
  import globalCss from '../../common/_global.scss?inline';
  import { widgetType } from '../../core/stores/widget.store';
  import { unsubscribeAllEffects } from '../../core/stores/effects';
  import type { ResourceProperties, Search } from '@nuclia/core';
  import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
  import { fieldData, fieldFullId, isPreviewing, resourceTitle } from '../../core/stores/viewer.store';
  import { distinctUntilChanged } from 'rxjs/operators';
  import type { FieldFullId } from '../../core/models';
  import Tile from '../../tiles/Tile.svelte';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = '';
  export let knowledgebox = '';
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
  export let kbslug = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';

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
    getResourceById(fullId.resourceId, [ResourceProperties.BASIC]).subscribe((resource) =>
      resourceTitle.set(resource.title || ''),
    );
  } else {
    closePreview();
  }

  export function openPreview(fullId: FieldFullId, title?: string): Observable<boolean> {
    fieldFullId.set(fullId);
    resourceTitle.set(title || '');

    return isPreviewing;
  }

  export function closePreview() {
    fieldFullId.set(null);
    resourceTitle.set('');
  }

  const tileResult: Observable<Search.SmartResult | null> = combineLatest([
    fieldFullId.pipe(distinctUntilChanged()),
    fieldData.pipe(distinctUntilChanged()),
    resourceTitle.pipe(distinctUntilChanged()),
  ]).pipe(
    switchMap(([fullId, data, title]) =>
      !!fullId && !data
        ? getResourceField(fullId as FieldFullId).pipe(map((resourceField) => fieldData.set(resourceField)))
        : of({ fullId, data, title }),
    ),
    map(({ fullId, data, title }) =>
      fullId && data ? { id: fullId.resourceId, field: fullId, fieldData: data, title } : null,
    ),
  );

  export const reset = () => {
    resetNuclia();
    unsubscribeAllEffects();
  };

  let svgSprite;
  let ready = false;

  onMount(() => {
    if (cdn) {
      setCDN(cdn);
    }

    initNuclia(
      {
        backend,
        zone,
        knowledgeBox: knowledgebox,
        client,
        apiKey: apikey,
        kbSlug: kbslug,
        account,
      },
      state,
      {},
    );

    // Setup widget in the store
    widgetType.set('viewer');

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    ready = true;

    return () => reset();
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready && !!svgSprite && $tileResult}
    <Tile result={$tileResult} />
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
