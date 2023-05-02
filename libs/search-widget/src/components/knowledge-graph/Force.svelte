<script lang="ts">
  import { forceSimulation } from 'd3';

  // utility function for translating elements
  const move = (x, y) => `transform: translate(${x}px, ${y}px)`;

  const maxRadius = 72;
  const minRadius = 6;

  export let height;
  export let width;
  // an array of our particles
  export let dots = [];
  // an array of [name, force] pairs
  export let forces = [];
  export let links = [];

  let usedForceNames = [];
  let renderedDots = [];
  let renderedLinks = [];

  $: console.log(dots);

  $: simulation = forceSimulation()
    .nodes(dots)
    .on('tick', () => {
      // update the renderedDots references to trigger an update
      renderedDots = [...dots];
    });

  $: {
    // re-initialize forces when they change
    forces.forEach(([name, force]) => {
      simulation.force(name, force);
    });

    // Update force link
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
</script>

<figure class="c">
  <svg
    width={Number.isNaN(width) ? 0 : width}
    height={Number.isNaN(height) ? 0 : height}>
    {#each renderedDots as dot, i}
      <g>
        <circle
          style={move(dot.x, dot.y)}
          fill={dots[i].color}
          stroke="#00000050"
          r={Math.max(Math.min(dot.radius, maxRadius || 0), minRadius)} />
        {#if dots[i].radius > 20}
          <text
            x={dot.x}
            y={dot.y}
            dx={getTextDx(dot.ner)}
            dy="5">
            {dot.ner}
          </text>
        {/if}
      </g>
    {/each}
    {#each renderedLinks as link}
      <line
        x1={link.source.x}
        y1={link.source.y}
        x2={link.target.x}
        y2={link.target.y}
        stroke="#00000050" />
      <!--      <path d={`M${link.source.x},${link.source.y}A75,75 0 0,1 ${link.target.x},${link.target.y}`} />-->
    {/each}
  </svg>
</figure>

<style>
  figure {
    margin: 0;
  }
  svg {
    overflow: visible;
  }
</style>
