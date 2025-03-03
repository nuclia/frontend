<script lang="ts">
  import { graphSelection, graphSelectionParagraphs, graphSelectionRelations } from '../../core';
  import type { NerLinkHydrated } from '../../core';
  import type { Observable } from 'rxjs';
  import { BehaviorSubject, combineLatest, map } from 'rxjs';
  import { Button } from '../../common';
  import ParagraphResult from '../../common/paragraph-result/ParagraphResult.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  const showMoreRelations: BehaviorSubject<boolean> = new BehaviorSubject(false);
  let relations: Observable<NerLinkHydrated[]> = combineLatest([graphSelectionRelations, showMoreRelations]).pipe(
    map(([selectionRelations, showMore]) =>
      selectionRelations.length < 10 || showMore ? selectionRelations : selectionRelations.slice(0, 10),
    ),
  );

  function onClickParagraph(paragraph) {
    dispatch('selectParagraph', paragraph);
  }
</script>

<div
  class="sw-knowledge-graph-panel"
  class:visible={!!$graphSelection}>
  {#if $graphSelection}
    <section>
      <p><strong>Relations</strong></p>
      <ul>
        {#each $relations as edge}
          <li>
            <div
              class="family-dot"
              style:background={edge.source.id === $graphSelection.id ? edge.target.color : edge.source.color} />
            {edge.source.ner}
            <strong>{edge.label}</strong>
            {edge.target.ner}
          </li>
        {/each}
      </ul>
      {#if $graphSelectionRelations.length >= 10}
        <div class="show-more-container">
          <Button
            aspect="basic"
            size="small"
            on:click={() => showMoreRelations.next(!showMoreRelations.getValue())}>
            Show {$showMoreRelations ? 'less' : 'more'}
          </Button>
        </div>
      {/if}
    </section>

    {#if $graphSelectionParagraphs.length > 0}
      <section class="results-section">
        <ul>
          {#each $graphSelectionParagraphs as paragraph}
            <ParagraphResult
              {paragraph}
              stack={true}
              disabled={true}
              on:open={() => onClickParagraph(paragraph)} />
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>

<style
  lang="scss"
  src="./KnowledgeGraphPanel.scss"></style>
