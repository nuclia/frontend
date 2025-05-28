<script lang="ts">
  import { run } from 'svelte/legacy';

  import type { NerLinkHydrated, NerLink, NerNode } from '../../core/knowledge-graph.models';
  import { createEventDispatcher } from 'svelte';
  import { graphSearchResults, graphSelection, graphSelectionRelations } from '../../core/stores/graph.store';
  import { getFontColor } from '../../core/utils';

  // utility function for translating elements
  const move = (x, y) => `transform: translate(${x}px, ${y}px)`;

  interface Props {
    // svg dimensions
    height: any;
    width: any;
    // an array of our particles
    nodes?: any;
    // an array of [name, force] pairs
    forces?: any;
    // an array NerLink to display as edges and apply as force.links
    links?: any;
    // array of visible family ids
    visibleFamilies: any;
  }

  let { height, width, nodes = [], forces = [], links = [], visibleFamilies }: Props = $props();

  const dispatch = createEventDispatcher();
  let usedForceNames = $state([]);
  let renderedDots = $state([]);
  let renderedLinks: NerLink[] = $state([]);

  let selectedNode: NerNode | null = $state(null);
  let selectedNodeRelationIds: string[] = $state([]);

  let filteredNodes = $state();
  let filteredLinks = $state();
  let simulation: any;

  run(() => {
    simulation = d3
      .forceSimulation()
      .nodes(nodes)
      .on('tick', () => {
        // update the renderedDots and renderedLinks references to trigger an update
        renderedDots = [...(filteredNodes || nodes)];
        renderedLinks = filteredLinks && filteredLinks.length > 0 ? [...filteredLinks] : [...links];
      });
  });

  run(() => {
    // re-initialize forces when they change
    forces.forEach(([name, force]) => {
      simulation.force(name, force);
    });

    // Update force link with our array of links
    if (links.length > 0) {
      simulation.force('link').links(links);
    }

    // remove old forces
    const newForceNames = forces.map(([name]) => name);
    let oldForceNames = usedForceNames.filter((force) => !newForceNames.includes(force));
    oldForceNames.forEach((name) => {
      simulation.force(name, null);
    });
    usedForceNames = newForceNames;

    // kick our simulation into high gear
    simulation.alpha(1);
    simulation.restart();
  });

  run(() => {
    // Filter nodes and edges depending on families selected on the left panel
    if (visibleFamilies) {
      filteredNodes = nodes.filter((node) => visibleFamilies.includes(node.family));
      filteredLinks = links.filter(
        (link) =>
          filteredNodes.some((node) => node.id === link.source.id) &&
          filteredNodes.some((node) => node.id === link.target.id),
      );
      if (filteredLinks.length > 0) {
        // remove orphan nodes
        filteredNodes = filteredNodes.filter(
          (node) =>
            filteredLinks.some((link) => node.id === link.source.id) ||
            filteredLinks.some((link) => node.id === link.target.id),
        );
      }

      renderedDots = [...filteredNodes];
      renderedLinks = [...filteredLinks];
    }
  });

  function selectNode(node: NerNode | null, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (selectedNode !== node) {
      selectedNode = node;
      const selectedLinks: NerLinkHydrated[] = [];
      selectedNodeRelationIds = !!node
        ? (links as NerLinkHydrated[]).reduce((nodeIds, link) => {
            if (link.source.id === node.id && !nodeIds.some((id) => id === link.target.id)) {
              nodeIds.push(link.target.id);
              selectedLinks.push(link);
            } else if (link.target.id === node.id && !nodeIds.some((id) => id === link.source.id)) {
              nodeIds.push(link.source.id);
              selectedLinks.push(link);
            }
            return nodeIds;
          }, [] as string[])
        : [];
      graphSelectionRelations.set(selectedLinks);
    }
    graphSelection.set(selectedNode);
    if (!selectedNode) {
      graphSearchResults.set(undefined);
    }
    dispatch('nodeSelection', selectedNode);
  }
</script>

<figure
  class="sw-graph"
  onclick={() => selectNode(null)}>
  {#if !!selectedNode}
    <div class="unselect-help">Click anywhere on the graph to unselect</div>
  {/if}
  <svg
    width={Number.isNaN(width) ? 0 : width}
    height={Number.isNaN(height) ? 0 : height}>
    {#each renderedLinks as link}
      <line
        x1={link.source.x}
        y1={link.source.y}
        x2={link.target.x}
        y2={link.target.y}
        stroke={!!selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id)
          ? '#000'
          : !!selectedNode
            ? '#C4C4C450'
            : '#00000050'} />
    {/each}

    {#each renderedDots as dot, i (dot.id)}
      <g
        class="node"
        class:selected={selectedNode === filteredNodes[i]}
        onclick={(event) => selectNode(filteredNodes[i], event)}>
        <circle
          style={move(dot.x, dot.y)}
          fill={!selectedNode ||
          selectedNode === filteredNodes[i] ||
          selectedNodeRelationIds.includes(filteredNodes[i].id)
            ? filteredNodes[i].color
            : '#C4C4C499'}
          stroke={selectedNode === filteredNodes[i] ? '#000' : '#00000025'}
          r={dot.radius}>
          <title>{dot.ner}</title>
        </circle>
        {#if filteredNodes[i].radius > 20 || filteredNodes.length < 30}
          <text
            x={dot.x}
            y={dot.y}
            class:small={filteredNodes[i].radius < 20}
            text-anchor="middle"
            dy="5"
            fill={!selectedNode ||
            selectedNode === filteredNodes[i] ||
            selectedNodeRelationIds.includes(filteredNodes[i].id)
              ? getFontColor(filteredNodes[i].color)
              : '#fff'}
            stroke="#00000050"
            stroke-width="0.5">
            {dot.ner}
          </text>
        {/if}
      </g>
    {/each}
  </svg>
</figure>

<style
  lang="scss"
  src="./Graph.scss"></style>
