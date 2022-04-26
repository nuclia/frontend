<script lang="ts">
  import Collapse from '../components/expander/expander.svelte';
  import { viewerStore } from './store';
  import { _ } from '../core/i18n';

  export let entities: [string, string[]][];
  let expanded = [];

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
    const colors = {
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

<div class="entities">
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

<style>
  .entities {
    max-width: 330px;
    background: #fff;
    box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.1);
  }
  button {
    position: relative;
    width: 100%;
    height: 2.5em;
    display: flex;
    align-items: center;
    padding: 0 2.25em 0 0;
    border: 0;
    background: #fff;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    -webkit-appearance: none;
  }
  button:hover {
    background-color: #f7f7f7;
  }
  button::before {
    content: '';
    position: absolute;
    left: 1.75em;
    right: 1.25em;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.2);
    height: 1px;
  }
  button.last::before {
    display: none;
  }
  button::after {
    content: '';
    width: 0;
    height: 0;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 8px solid rgba(0, 0, 0, 0.5);
    position: absolute;
    right: 1.25em;
    top: 16px;
    transition: transform 0.3s;
  }
  button.expanded::after {
    transform: rotate(-90deg);
  }
  button .color {
    flex: 0 0 auto;
    height: 100%;
    width: 1em;
    background-color: #eee;
    margin-right: 1.5em;
  }
  button .group-name {
    flex: 1 1 0;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0.5em 0;
    max-height: 400px;
    overflow: auto;
  }
  li {
    display: flex;
    align-items: center;
    height: 3em;
    padding: 0 2.25em 0 3em;
    cursor: pointer;
  }
  li:hover {
    text-decoration: underline;
  }
</style>
