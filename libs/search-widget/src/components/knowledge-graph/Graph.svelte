<script lang="ts">
  import { forceSimulation, rgb } from 'd3';
  import { NerLink } from './knowledge-graph.models';

  // utility function for translating elements
  const move = (x, y) => `transform: translate(${x}px, ${y}px)`;

  export let height;
  export let width;
  // an array of our particles
  export let nodes = [];
  // an array of [name, force] pairs
  export let forces = [];
  export let links = [];

  let usedForceNames = [];
  let renderedDots = [];
  let renderedLinks: NerLink[] = [];

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

<figure class="sw-graph">
  <svg
    width={Number.isNaN(width) ? 0 : width}
    height={Number.isNaN(height) ? 0 : height}>
    {#each renderedLinks as link}
      <line
        x1={link.source.x}
        y1={link.source.y}
        x2={link.target.x}
        y2={link.target.y}
        stroke="#00000050" />
    {/each}
    {#each renderedDots as dot, i}
      <g class="node">
        <circle
          style={move(dot.x, dot.y)}
          fill={nodes[i].color}
          stroke="#00000050"
          r={dot.radius} />
        {#if nodes[i].radius > 20}
          <text
            x={dot.x}
            y={dot.y}
            dx={getTextDx(dot.ner)}
            dy="5"
            stroke={getFontColor(nodes[i].color)}>
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
