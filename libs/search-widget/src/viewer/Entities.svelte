<script lang="ts">
  import Collapse from '../components/expander/expander.svelte';
  import { viewerStore } from './store';
  import { _ } from '../core/i18n';

  export let entities: [string, string[]][];
  let expanded: string[] = [];

  const toggle = (group: string) => {
    if (isExpanded(group)) {
      expanded = expanded.filter((g) => g !== group);
    } else {
      expanded = [...expanded, group];
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

  const getColor = (group: string) => {
    const colors: { [key: string]: string } = {
      DATE: '#ff8989',
      FAC: '#81d8ac',
      GPE: '#454ade',
      LAW: '#1E264F',
      LOC: '#b7a38d',
      MAIL: '#e81c66',
      ORG: '#6eb0ec',
      PERSON: '#ffe186',
      QUANTITY: '#b035c9',
      MONEY: '#ff8c4b',
      PERCENT: '#1e264f',
      TIME: '#21b8a6',
      EVENT: '#cba2da',
      NORP: '#743ccf',
      PRODUCT: '#d74f57',
      WORK_OF_ART: '#ffbccc',
      LANGUAGE: '#d1d3ff',
    };
    return colors[group] || '#eee';
  };
</script>

<div class="sw-entities">
  {#each entities as group, i}
    <Collapse expanded={expanded.includes(group[0])}>
      <button
        slot="header"
        on:click={() => {
          toggle(group[0]);
        }}
        class:expanded={expanded.includes(group[0])}
        class:last={i === entities.length - 1}
      >
        <div class="color" style:background={getColor(group[0])} />
        <div class="group-name">{$_('entities.' + group[0].toLowerCase())} ({group[1].length})</div>
      </button>
      <ul>
        {#each group[1] as entity}
          <li tabIndex="0" role="button" on:click={() => search(entity)} on:keyup={(e) => onKeyUp(e, entity)}>
            {entity}
          </li>
        {/each}
      </ul>
    </Collapse>
  {/each}
</div>
