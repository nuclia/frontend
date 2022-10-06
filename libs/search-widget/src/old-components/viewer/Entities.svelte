<script lang="ts">
  import Expander from '../../common/expander/Expander.svelte';
  import { viewerStore } from '../../core/old-stores/viewer.store';
  import { _ } from '../../core/i18n';
  import { combineLatest, map, Observable } from 'rxjs';
  import type { EntityGroup } from '../../core/models';
  import { tap } from 'rxjs/operators';
  import Icon from '../../common/icons/Icon.svelte';
  import { annotationMode, selectedFamily } from '../../core/stores/annotation.store';
  import { entityGroups, resourceAnnotatedEntities, resourceEntities } from '../../core/stores/entities.store';

  export let showAnnotated = false;

  const resourceEntityGroups: Observable<EntityGroup[]> = showAnnotated ? resourceAnnotatedEntities : resourceEntities;

  let expanded: string[] = [];

  const toggleAnnotationMode = () => {
    if ($annotationMode) {
      expanded = [];
    }
  };
  $: entityList = combineLatest([resourceEntityGroups, entityGroups]).pipe(
    tap(() => toggleAnnotationMode()),
    map(([entitiesFromResource, allEntitiesFromKb]) =>
      !showAnnotated && $annotationMode ? allEntitiesFromKb : entitiesFromResource,
    ),
  );

  const toggle = (group: string) => {
    if (isExpanded(group)) {
      expanded = expanded.filter((g) => g !== group);
    } else {
      expanded = $annotationMode ? [group] : [...expanded, group];
    }
    if ($annotationMode) {
      selectedFamily.set(expanded[0]);
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
      <button
        slot="header"
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
          <li
            tabIndex="0"
            role="button"
            class:clickable={showAnnotated || !$annotationMode}
            on:click={() => {
              if (showAnnotated || !$annotationMode) search(entity);
            }}
            on:keyup={(e) => {
              if (showAnnotated || !$annotationMode) onKeyUp(e, entity);
            }}
          >
            {entity}
          </li>
        {/each}
      </ul>
    </Expander>
  {/each}
</div>

<style lang="scss" src="./Entities.scss"></style>
