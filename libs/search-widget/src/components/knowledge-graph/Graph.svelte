<script lang="ts">
  import { forceSimulation, rgb } from 'd3';
  import { NerLinkHydrated, NerLink, NerNode } from '../../core/knowledge-graph.models';
  import { createEventDispatcher } from 'svelte';
  import { graphSearchResults, graphSelection, graphSelectionRelations } from '../../core/stores/graph.store';

  const dispatch = createEventDispatcher();
  // utility function for translating elements
  const move = (x, y) => `transform: translate(${x}px, ${y}px)`;

  // svg dimensions
  export let height;
  export let width;
  // an array of our particles
  export let nodes = [];
  // an array of [name, force] pairs
  export let forces = [];
  // an array NerLink to display as edges and apply as force.links
  export let links = [];

  let usedForceNames = [];
  let renderedDots = [];
  let renderedLinks: NerLink[] = [];

  let selectedNode: NerNode | null = null;
  let selectedNodeRelationIds: string[] = [];

  $: simulation = forceSimulation()
    .nodes(nodes)
    .on('tick', () => {
      // update the renderedDots and renderedLinks references to trigger an update
      renderedDots = [...nodes];
      renderedLinks = [...links];
    });

  $: {
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
  }

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

  /**
   * Get delta x to apply on node text to have it as centered as possible
   * @param text
   */
  function getTextDx(text: string): number {
    return text.length <= 3 ? text.length * -5 : text.length * -4.5;
  }

  /**
   * Return black for bright color, and white for dark color
   * @param hexa: hexadecimal color
   */
  function getFontColor(hexa: string): string {
    const color = rgb(hexa);
    // Counting the perceptive luminance - human eye favors green color...
    const luminance = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
    return luminance > 0.5 ? '#000' : '#fff';
  }
</script>

<figure
  class="sw-graph"
  on:click={() => selectNode(null)}>
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
    {#each renderedDots as dot, i}
      <g
        class="node"
        class:selected={selectedNode === nodes[i]}
        on:click={(event) => selectNode(nodes[i], event)}>
        <circle
          style={move(dot.x, dot.y)}
          fill={!selectedNode || selectedNode === nodes[i] || selectedNodeRelationIds.includes(nodes[i].id)
            ? nodes[i].color
            : '#C4C4C499'}
          stroke={selectedNode === nodes[i] ? '#000' : '#00000025'}
          r={dot.radius} />
        {#if nodes[i].radius > 20}
          <text
            x={dot.x}
            y={dot.y}
            dx={getTextDx(dot.ner)}
            dy="5"
            fill={!selectedNode || selectedNode === nodes[i] || selectedNodeRelationIds.includes(nodes[i].id)
              ? getFontColor(nodes[i].color)
              : '#fff'}>
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
