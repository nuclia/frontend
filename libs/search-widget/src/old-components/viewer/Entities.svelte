<script lang="ts">
  import Expander from '../../common/expander/Expander.svelte';
  import { viewerStore } from '../../core/stores/viewer.store';
  import { _ } from '../../core/i18n';
  import { nucliaState } from '../../core/stores/main.store';
  import { combineLatest, map, Observable } from 'rxjs';
  import type { EntityGroup } from '../../core/models';
  import { tap } from 'rxjs/operators';
  import Icon from '../../common/icons/Icon.svelte';

  const allEntities = nucliaState().entities;
  const resourceEntities: Observable<EntityGroup[]> = viewerStore.resourceEntities;
  const annotationMode = viewerStore.annotationMode;

  let expanded: string[] = [];

  const toggleAnnotationMode = () => {
    const annotationModeEnabled = annotationMode.getValue();
    if (annotationModeEnabled) {
      expanded = [];
    }
  };
  $: entityList = combineLatest([
    annotationMode,
    resourceEntities,
    allEntities,
  ]).pipe(
    tap(() => toggleAnnotationMode()),
    map(([annotationEnabled, entitiesFromResource, allEntitiesFromKb]) => annotationEnabled ? allEntitiesFromKb : entitiesFromResource),
  );

  const toggle = (group: string) => {
    const annotationModeEnabled = annotationMode.getValue();
    if (isExpanded(group)) {
      expanded = expanded.filter((g) => g !== group);
    } else {
      expanded = annotationModeEnabled ? [group] : [...expanded, group];
    }
    if (annotationModeEnabled) {
      viewerStore.selectedFamily.next(expanded[0]);
    }
  };

  const isExpanded = (group: string) => {
    return expanded.includes(group);
  };

  const search = (entity: string) => {
    viewerStore.query.next(entity);
  };

  const onKeyUp = (event: KeyboardEvent, entity: string) => {
    if (event.key === 'Enter') search(entity);
  };


</script>

<div class="sw-entities">
  {#each $entityList as group, i}
    <Expander expanded={expanded.includes(group.id)}>
      <button slot="header"
              on:click={() => toggle(group.id)}
              class:expanded={expanded.includes(group.id)}
              class:last={i === $entityList.length - 1}
      >
        <div class="color" style:background={group.color}/>
        <div class="group-name">{$_(group.title)} ({group.entities.length})</div>
        <div class="icon-container">
          <Icon name="chevron-left"/>
        </div>
      </button>
      <ul>
        {#each group.entities as entity}
          <li tabIndex="0" role="button"
              class:clickable={!$annotationMode}
              on:click={() => {
                if (!$annotationMode) search(entity);
              }}
              on:keyup={(e) => {
                if (!$annotationMode) onKeyUp(e, entity)
              }}>
            {entity}
          </li>
        {/each}
      </ul>
    </Expander>
  {/each}
</div>

<style lang="scss" src="./Entities.scss"></style>
