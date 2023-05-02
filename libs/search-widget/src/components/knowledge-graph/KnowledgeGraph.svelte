<script lang="ts">
  import { fieldData } from '../../core/stores/viewer.store';
  import Expander from '../../common/expander/Expander.svelte';
  import { _, translateInstant } from '../../core/i18n';
  import { generatedEntitiesColor } from '../../core/utils';
  import Force from './Force.svelte';
  import { forceCenter, forceCollide, forceLink, forceManyBody, forceX, forceY } from 'd3';
  import { onDestroy, onMount } from 'svelte';
  import { map, Subject, takeUntil } from 'rxjs';
  import { filter } from 'rxjs/operators';
  import { FieldMetadata } from '@nuclia/core';
  import type {
    NerFamily,
    NerLink,
    NerNode,
    PositionWithRelevance,
    RelationWithRelevance,
  } from './knowledge-graph.models';

  const unsubscribeAll: Subject<void> = new Subject();
  const defaultFamilyColor = '#c6c6c6';

  let families: NerFamily[] = [];
  let innerHeight: number;
  let innerWidth: number;
  let dots;
  let links: NerLink[];
  $: graphWidth = innerWidth - 248;
  $: graphHeight = innerHeight - 80;

  $: centerPosition = [graphWidth / 2, graphHeight / 2];
  $: activeForceX = forceX().x(centerPosition[0]);
  $: activeForceY = forceY().y(centerPosition[1]);
  $: forces = [
    ['x', activeForceX],
    ['y', activeForceY],
    [
      'link',
      forceLink()
        .id((d) => (d as NerNode).id)
        .distance(100),
    ],
    ['charge', forceManyBody().strength(-80)],
    ['center', forceCenter(graphWidth / 2, graphHeight / 2)],
  ].filter((d) => d);

  onMount(() => {
    fieldData
      .pipe(
        map((data) => data?.extracted?.metadata?.metadata),
        filter((metadata) => !!metadata),
        map((metadata) => metadata as FieldMetadata),
        takeUntil(unsubscribeAll),
      )
      .subscribe((metadata) => {
        const { relations, positions } = getRelevanceLists(metadata);
        const nodes = getNodes(positions);
        links = getLinks(relations, positions);

        setFamilies(nodes);
        dots = nodes.map((node) => ({
          ...node,
          color: generatedEntitiesColor[node.family] || defaultFamilyColor,
          radius: node.relevance,
        }));
      });
  });

  onDestroy(() => {
    unsubscribeAll.next();
    unsubscribeAll.complete();
  });

  function getNodes(positions: PositionWithRelevance): NerNode[] {
    return (
      Object.keys(positions)
        .reduce((list, id) => {
          const [family, ner] = id.split('/');
          list.push({
            id,
            ner,
            family,
            relevance: positions[id].relevance || 0,
          });
          return list;
        }, [] as NerNode[])
        // keep only relevant nodes
        .filter((node) => node.relevance > 0)
    );
  }

  function getLinks(relations: RelationWithRelevance[], positions: PositionWithRelevance): NerLink[] {
    return relations
      .filter(
        (relation) =>
          !!relation['from_'] &&
          positions[`${relation['from_'].group}/${relation['from_'].value}`] &&
          !!relation.to &&
          positions[`${relation.to.group}/${relation.to.value}`],
      )
      .map((relation) => ({
        source: `${relation['from_']?.group}/${relation['from_']?.value}`,
        target: `${relation.to.group}/${relation.to.value}`,
        fromGroup: relation['from_']?.group,
        toGroup: relation.to.group,
        relevance: relation.relevance || 0,
        label: relation.label,
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
    const relations = metadata.relations || [];
    const positions = JSON.parse(JSON.stringify(metadata.positions || {}));
    relations.forEach((relation) => {
      if (relation['from_']) {
        const from: PositionWithRelevance = positions[`${relation['from_'].group}/${relation['from_'].value}`];
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
        const from: PositionWithRelevance | undefined = relation['from_']
          ? positions[`${relation['from_'].group}/${relation['from_'].value}`]
          : undefined;
        const to: PositionWithRelevance = positions[`${relation.to.group}/${relation.to.value}`];
        const relevance = Math.min(from?.relevance || 0, to?.relevance || 0);
        return {
          ...relation,
          relevance,
        };
      }),
      positions,
    };
  }

  function setFamilies(nodes: NerNode[]) {
    const familyIds = nodes.reduce((families, node) => {
      if (!families.includes(node.family)) {
        families.push(node.family);
      }
      return families;
    }, []);
    families = familyIds
      .map((id) => {
        const color = generatedEntitiesColor[id] || defaultFamilyColor;
        return {
          id,
          color,
          label: !!color ? translateInstant('entities.' + id.toLowerCase()) : id.toLocaleLowerCase(),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }
</script>

<svelte:window
  bind:innerWidth
  bind:innerHeight />

<div class="sw-knowledge-graph">
  <div class="left-panel">
    <div class="ner-families-container">
      <Expander
        on:toggleExpander
        expanded={true}>
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
              {family.label}
            </li>
          {/each}
        </ul>
      </Expander>
    </div>
  </div>
  <div class="knowledge-graph-container">
    <Force
      {dots}
      {forces}
      {links}
      height={graphHeight}
      width={graphWidth} />
  </div>
</div>

<style
  lang="scss"
  src="./KnowledgeGraph.scss"></style>
