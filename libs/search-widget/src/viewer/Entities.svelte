<script lang="ts">
  import Collapse from '../components/expander/expander.svelte';
  import { viewerStore } from './viewer.store';
  import { _ } from '../core/i18n';
  import { nucliaState } from '../core/store';
  import { combineLatest, map, Observable } from 'rxjs';
  import type { EntityGroup } from '../core/models';
  import { tap } from 'rxjs/operators';

  const allEntities = nucliaState().entities;
  const resourceEntities: Observable<EntityGroup[]> = viewerStore.resourceEntities;
  const annotationMode = viewerStore.annotationMode;

  let expanded: string[] = [];

  const toggleAnnotationMode = () => {
    const annotationModeEnabled = annotationMode.getValue();
    if (annotationModeEnabled) {
      expanded = [];
    }
  }
  $: entityList = combineLatest([
    annotationMode,
    resourceEntities,
    allEntities
  ]).pipe(
    tap(() => toggleAnnotationMode()),
    map(([annotationEnabled, entitiesFromResource, allEntitiesFromKb]) => annotationEnabled ? allEntitiesFromKb : entitiesFromResource)
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
    <Collapse expanded={expanded.includes(group.id)}>
      <button
        slot="header"
        on:click={() => {
          toggle(group.id);
        }}
        class:expanded={expanded.includes(group.id)}
        class:last={i === $entityList.length - 1}
      >
        <div class="color" style:background={group.color} />
        <div class="group-name">{$_(group.title)} ({group.entities.length})</div>
      </button>
      <ul>
        {#each group.entities as entity}
          <li tabIndex="0" role="button" on:click={() => search(entity)} on:keyup={(e) => onKeyUp(e, entity)}>
            {entity}
          </li>
        {/each}
      </ul>
    </Collapse>
  {/each}
</div>

<style lang="scss" src="./Entities.scss"></style>
