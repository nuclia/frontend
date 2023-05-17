<script>
    import { createEventDispatcher } from 'svelte';

  export let data = {};

  const dispatch = createEventDispatcher();

  let total = 0;
  // set the dimensions and margins of the graph
  const width = 900,
      height = 450,
      margin = 40;
      // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
  const radius = Math.min(width, height) / 2 - margin;
  let svg;
  let color;
  let pie;
  let arc;
  let outerArc;
  let isInit = false;

  $: {
    if (isInit) {
      d3.select("#chart").selectAll("*").remove();
      init(data);
    }
  }
  function key(d) {
    const key = `${d.data.id}-${ratio(d)}`;
    return key;
  }

function init() {  
  // append the svg object to the div called 'chart'
  svg = d3.select("#chart")
    .append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", `translate(${width/2},${height/2})`);
      
      isInit = true;
      render(data);
    }
    
    function render(data) {
      total = Object.values(data).reduce((acc, current) => acc + current.value, 0);
  // set the color scale
  color = d3.scaleOrdinal()
    .domain(Object.values(data).map(d => d.label))
    .range(d3.schemeDark2);
  
  // Compute the position of each group on the pie:
  pie = d3.pie()
    .sort(null) // Do not sort group by size
    .value(d => {
      return d.value;
    })
    
    // The arc generator
   arc = d3.arc()
    .innerRadius(radius * 0.5)         // This is the size of the donut hole
    .outerRadius(radius * 0.8)
  
  // Another arc that won't be drawn. Just for labels positioning
   outerArc = d3.arc()
   .innerRadius(radius * 0.9)
   .outerRadius(radius * 0.9)
  
  const data_ready = pie(Object.values(data));
  
  // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
  const slices = svg
    .selectAll('.slice')
    .data(data_ready, key)
  
    slices.join(function (enter) {
      return enter.append('path')
        .attr('class', 'slice')
        .attr('d', arc)
        .attr('fill', d => color(d.data.label))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .style("cursor", "pointer")
        .on('click', (d, i) => {
          dispatch('click', i.data);
        })
    },
    () => {},
    function(exit) {
      return exit.remove();
    });
    
  // Add the polylines between chart and labels:
  svg
    .selectAll('.line')
    .data(data_ready, key)
    .join(function (enter) {
      return enter.append('polyline')
        .attr('class', 'line')
        .attr("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
          const posA = arc.centroid(d) // line insertion in the slice
          const posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
          const posC = outerArc.centroid(d); // Label position = almost the same as posB
          const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
          posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
          return [posA, posB, posC]
        })
      },
      () => {},
      function(exit) {
        return exit.remove();
      })
  
  // Add the polylines between chart and labels:
  svg
    .selectAll('.label')
    .data(data_ready, key)
    .join(function (enter) {
      return enter.append('text')
        .attr('class', 'label')
        .text(d => {
          return `${d.data.label} ${ratio(d)}%`;
        })
        .attr('transform', function(d) {
            const pos = outerArc.centroid(d);
            const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
            return `translate(${pos})`;
        })
        .style('text-anchor', function(d) {
            const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
            return (midangle < Math.PI ? 'start' : 'end')
        })
        .style("cursor", "pointer")
        .on('click', (d, i) => {
          dispatch('click', i.data);
        });
      },
      () => {},
      function(exit) {
        return exit.remove();
      })
    }

    function ratio(d) {
      return Math.round(100*d.data.value / total)
    }
  </script>

<div id="chart"></div>

<svelte:head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.0.0/d3.min.js" on:load={() => init()}></script>
</svelte:head>


