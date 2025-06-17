<script lang="ts">
  import { forceSimulation, type ForceLink } from 'd3-force';
  import { createEventDispatcher } from 'svelte';
  import type { NerLink, NerNode } from '../../core/knowledge-graph.models';
  import { graphSearchResults, graphSelection, graphSelectionRelations } from '../../core/stores/graph.store';
  import { getFontColor } from '../../core/utils';

  // utility function for translating elements
  const move = (x: number | undefined, y: number | undefined) =>
    typeof x === 'number' && typeof y === 'number' ? `transform: translate(${x}px, ${y}px)` : '';

  interface Props {
    // svg dimensions
    height: number;
    width: number;
    // an array of our particles
    nodes?: NerNode[];
    // an array of [name, force] pairs
    forces?: [string, any][];
    // an array NerLink to display as edges and apply as force.links
    links?: NerLink[];
    // array of visible family ids
    visibleFamilies: any;
  }

  let { height, width, nodes = [], forces = [], links = [], visibleFamilies }: Props = $props();

  const dispatch = createEventDispatcher();
  let usedForceNames: string[] = [];

  let selectedNode: NerNode | null = $state(null);
  let selectedNodeRelationIds: string[] = $state([]);

  let filteredNodes: NerNode[] = $state([]);
  let filteredLinks: NerLink[] = $state([]);

  let renderedDots: NerNode[] = $derived([...(filteredNodes || nodes)]);
  let renderedLinks: NerLink[] = $derived(filteredLinks && filteredLinks.length > 0 ? [...filteredLinks] : [...links]);

  // We want the simulation to run when the nodes changes (as they are coming from the props)
  // but nodes and links are also updated by the simulation,
  // so to prevent infinite loop of rendering, we let the simulation run only 3 times
  // (we need it to run at least 3 times to let the forces interact with the nodes)
  let simulationCount = 0;
  $effect(() => {
    if (nodes && simulationCount < 3) {
      runSimultation();
      simulationCount++;
    }
  });

  $effect(() => {
    // Filter nodes and edges depending on families selected on the left panel
    if (visibleFamilies) {
      let filteredNodeList = nodes.filter((node) => visibleFamilies.includes(node.family));
      const filteredLinkList = links.filter(
        (link) =>
          filteredNodeList.some((node) => node.id === (link.source as NerNode).id) &&
          filteredNodeList.some((node) => node.id === (link.target as NerNode).id),
      );
      if (filteredLinkList.length > 0) {
        // remove orphan nodes
        filteredNodeList = filteredNodeList.filter(
          (node) =>
            filteredLinkList.some((link) => node.id === (link.source as NerNode).id) ||
            filteredLinkList.some((link) => node.id === (link.target as NerNode).id),
        );
      }
      filteredNodes = filteredNodeList;
      filteredLinks = filteredLinkList;
    }
  });

  function runSimultation() {
    console.log(`runSimulation`);
    const simulation = forceSimulation().nodes(nodes);

    if (simulation) {
      // re-initialize forces when they change
      forces.forEach(([name, force]) => {
        simulation.force(name, force);
      });

      // Update force link with our array of links
      if (links.length > 0) {
        (simulation.force('link') as ForceLink<NerNode, NerLink>).links(links);
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
  }

  function selectNode(node: NerNode | null, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (selectedNode !== node) {
      selectedNode = node;
      const selectedLinks: NerLink[] = [];
      selectedNodeRelationIds = !!node
        ? (links as NerLink[]).reduce((nodeIds, link) => {
            const sourceId = (link.source as NerNode).id;
            const targetId = (link.target as NerNode).id;
            if (sourceId === node.id && !nodeIds.some((id) => id === targetId)) {
              nodeIds.push(targetId);
              selectedLinks.push(link);
            } else if (targetId === node.id && !nodeIds.some((id) => id === sourceId)) {
              nodeIds.push(sourceId);
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

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
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
        x1={(link.source as NerNode).x}
        y1={(link.source as NerNode).y}
        x2={(link.target as NerNode).x}
        y2={(link.target as NerNode).y}
        stroke={!!selectedNode &&
        ((link.source as NerNode).id === selectedNode.id || (link.target as NerNode).id === selectedNode.id)
          ? '#000'
          : !!selectedNode
            ? '#C4C4C450'
            : '#00000050'} />
    {/each}

    {#each renderedDots as dot, i (dot.id)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
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

<style src="./Graph.css"></style>
