<script lang="ts">
  import type { NerFamily, NerLink, NerNode, PositionWithRelevance, RelationWithRelevance } from '../../core';
  import { fieldMetadata, generatedEntitiesColor, graphState, translateInstant } from '../../core';
  import { Checkbox, Expander } from '../../common';
  import Graph from './Graph.svelte';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { map, Subject, takeUntil } from 'rxjs';
  import { filter } from 'rxjs/operators';
  import { DEFAULT_NER_KEY, type EntityPositions, type FieldMetadata } from '@nuclia/core';

  export let rightPanelOpen = false;

  const dispatch = createEventDispatcher();
  const unsubscribeAll: Subject<void> = new Subject();
  const leftPanelWidth = 248;
  const rightPanelWidth = 368;
  const defaultFamilyColor = '#c6c6c6';
  const maxRadius = 64;
  const minRadius = 6;

  let families: NerFamily[] = [];
  let innerHeight: number;
  let innerWidth: number;
  let nodes: NerNode[];
  let links: NerLink[];

  let visibleFamilies: string[];

  $: graphWidth = rightPanelOpen ? innerWidth - leftPanelWidth - rightPanelWidth : innerWidth - leftPanelWidth;
  $: graphHeight = innerHeight - 80;

  $: chargeStrength = !nodes || nodes.length > 100 ? -80 : -160;
  $: centerPosition = [graphWidth / 2, graphHeight / 2];
  $: activeForceX = d3.forceX().x(centerPosition[0]);
  $: activeForceY = d3.forceY().y(centerPosition[1]);
  $: forces = [
    ['x', activeForceX],
    ['y', activeForceY],
    [
      'link',
      d3
        .forceLink()
        .id((d) => (d as NerNode).id)
        .distance((link: d3.SimulationLinkDatum<any>) => {
          const source: NerNode = link.source;
          const target: NerNode = link.target;
          const radiusSum = source.radius + target.radius;
          return radiusSum + radiusSum / 2;
        })
    ],
    ['charge', d3.forceManyBody().strength(chargeStrength)]
  ].filter((d) => d);

  onMount(() => {
    fieldMetadata
      .pipe(
        filter((metadata) => !!metadata),
        map((metadata) => metadata as FieldMetadata),
        takeUntil(unsubscribeAll)
      )
      .subscribe((metadata) => {
        const { relations, positions } = getRelevanceLists(metadata);
        links = getLinks(relations, positions);
        nodes = getNodes(positions);
        setFamilies(nodes);
      });
  });

  onDestroy(() => {
    unsubscribeAll.next();
    unsubscribeAll.complete();
    graphState.reset();
  });

  function getNodes(positions: PositionWithRelevance): NerNode[] {
    const relevanceList = Object.values(positions)
      .map((position) => position.relevance)
      .filter((value) => value);
    const [, maxRelevance] = d3.extent(relevanceList);
    const radiusRatio = Math.max(1, maxRadius / maxRelevance);
    return (
      Object.keys(positions)
        .reduce((list, id) => {
          const family = id.split('/')[0];
          const ner = id.substring(family.length + 1);
          const relevance = positions[id].relevance || 0;
          list.push({
            id,
            ner,
            family,
            relevance,
            color: generatedEntitiesColor[family] || defaultFamilyColor,
            radius: Math.max(Math.min(relevance * radiusRatio, maxRadius || 0), minRadius)
          });
          return list;
        }, [] as NerNode[])
        // keep only relevant nodes which are in a link
        .filter(
          (node) => node.relevance > 0 && links.some((link) => link.source === node.id || link.target === node.id)
        )
    );
  }

  function getLinks(relations: RelationWithRelevance[], positions: PositionWithRelevance): NerLink[] {
    return relations
      .filter(
        (relation) =>
          !!relation.from &&
          positions[`${relation.from.group}/${relation.from.value}`] &&
          !!relation.to &&
          positions[`${relation.to.group}/${relation.to.value}`]
      )
      .map((relation) => ({
        source: `${relation.from?.group}/${relation.from?.value}`,
        target: `${relation.to.group}/${relation.to.value}`,
        fromGroup: relation.from?.group,
        toGroup: relation.to.group,
        relevance: relation.relevance || 0,
        label: relation.label
      }));
  }

  /**
   * Compute relevance of each relation by checking how many times they are found in positions.
   * We increment the relevance for both `from` and `to` properties of relations.
   * When both `from` and `to` have a relevance, the relevance of the relation is the smallest of them.
   * Otherwise, the relevance of the relation is the relevance of either `to` or `from`.
   * @param metadata: FieldMetadata
   */
  function getRelevanceLists(metadata: FieldMetadata): {
    relations: RelationWithRelevance[];
    positions: PositionWithRelevance;
  } {
    const customNerPositions = Object.entries(metadata.entities)
      .filter(([key]) => key !== DEFAULT_NER_KEY)
      .reduce((acc, [, value]) => {
        value.entities.forEach((entity) => {
          acc[`${entity.label}/${entity.text}`] = { position: entity.positions, entity: entity.text };
        });
        return acc;
      }, {} as EntityPositions);
    const relations = metadata.relations || [];
    const positions = {
      ...JSON.parse(JSON.stringify(metadata.positions || {})),
      ...customNerPositions,
    };

    relations.forEach((relation) => {
      if (relation.from) {
        const from: PositionWithRelevance = positions[`${relation.from.group}/${relation.from.value}`];
        if (from) {
          from.relevance = (from.relevance || 0) + 1;
        }
      }
      const to: PositionWithRelevance = positions[`${relation.to.group}/${relation.to.value}`];
      if (to) {
        to.relevance = (to.relevance || 0) + 1;
      }
    });
    return {
      relations: relations.map((relation) => {
        const from: PositionWithRelevance | undefined = relation.from
          ? positions[`${relation.from.group}/${relation.from.value}`]
          : undefined;
        const to: PositionWithRelevance = positions[`${relation.to.group}/${relation.to.value}`];
        const relevance = Math.min(from?.relevance || 0, to?.relevance || 0);
        return {
          ...relation,
          relevance
        };
      }),
      positions
    };
  }

  function setFamilies(nodes: NerNode[]) {
    visibleFamilies = nodes.reduce((families, node) => {
      if (!families.includes(node.family)) {
        families.push(node.family);
      }
      return families;
    }, []);
    families = visibleFamilies
      .map((id) => {
        const generatedEntityColor = generatedEntitiesColor[id];
        const color = generatedEntityColor || defaultFamilyColor;
        return {
          id,
          color,
          label: !!generatedEntityColor ? translateInstant('entities.' + id.toLowerCase()) : id.toLocaleLowerCase()
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  function selectNode(node: NerNode | null) {
    if (!!node && !rightPanelOpen) {
      dispatch('openRightPanel');
    }
  }

  function toggleFamily(family: NerFamily, selected: boolean) {
    if (selected) {
      visibleFamilies = visibleFamilies.concat([family.id]);
    } else {
      visibleFamilies = visibleFamilies.filter((id) => family.id !== id);
    }
  }
</script>

<svelte:window
  bind:innerWidth
  bind:innerHeight />

<div
  class="sw-knowledge-graph"
  class:with-right-panel={rightPanelOpen}>
  <div class="left-panel">
    <div class="ner-families-container">
      <Expander on:toggleExpander>
        <div
          class="title-s"
          slot="header">
          Entity families
        </div>
        <ul class="ner-families">
          {#each families as family}
            <li>
              <div
                class="family-color"
                style:background={family.color} />
              <Checkbox
                checked={visibleFamilies.includes(family.id)}
                on:change={(event) => toggleFamily(family, event.detail)}>
                {family.label}
              </Checkbox>
            </li>
          {/each}
        </ul>
      </Expander>
    </div>
  </div>
  <div class="knowledge-graph-container">
    <Graph
      {nodes}
      {forces}
      {links}
      {visibleFamilies}
      height={graphHeight}
      width={graphWidth}
      on:nodeSelection={(event) => selectNode(event.detail)} />
  </div>
</div>

<style
  lang="scss"
  src="./KnowledgeGraph.scss"></style>
