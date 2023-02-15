<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { EntityPositions, FieldMetadata, Relation, RelationType } from '@nuclia/core';
  import { filter, Observable, take } from 'rxjs';

  export let metadata: Observable<FieldMetadata | undefined>;

  let el: HTMLElement | undefined;
  let simulation;
  let node, link, edgelabels;
  let groups = ['Resource'];
  let displayedGroups: { [group: string]: boolean } = { Resource: true, PERSON: true };
  let displayedGroupList = Object.keys(displayedGroups).filter((key) => displayedGroups[key]);
  let ners: EntityPositions = {};
  let relations: Relation[] = [];

  onMount(() => {
    metadata
      .pipe(
        filter((metadata) => !!metadata),
        take(1),
      )
      .subscribe((metadata) => {
        if (metadata?.positions && metadata?.relations) {
          groups = Object.keys(metadata.positions).reduce(
            (acc, cur) => {
              const family = cur.split('/')[0];
              if (!acc.includes(family)) {
                acc.push(family);
              }
              return acc;
            },
            ['Resource'],
          );
          ners = metadata.positions;
          relations = metadata.relations;
          draw();
        }
      });
  });

  function draw() {
    const color = (d) => {
      if (d.family === 'Resource') {
        return '#000';
      }
      return d3.interpolateRainbow(groups.indexOf(d.family) / groups.length);
    };
    const nodes = Object.keys(ners).reduce((acc, cur) => {
      const [family, ner] = cur.split('/');
      acc.push({
        id: cur,
        ner,
        family,
      });
      return acc;
    }, [] as { id: string; ner: string; family: string }[]);

    const links = relations
      .filter(
        (rel) =>
          !!rel.from &&
          ners[`${rel.from.group}/${rel.from.value}`] &&
          !!rel.to &&
          ners[`${rel.to.group}/${rel.to.value}`],
      )
      .map((rel) => ({
        source: `${rel.from.group}/${rel.from.value}`,
        target: `${rel.to.group}/${rel.to.value}`,
        fromGroup: rel.from.group,
        toGroup: rel.to.group,
        label: rel.label,
        value: 2,
      }));

    nodes.forEach((node) =>
      links.push({
        source: 'Resource/Resource',
        target: node.id,
        fromGroup: 'Resource',
        toGroup: node.family,
        label: '',
        value: 1,
      }),
    );
    nodes.push({ id: 'Resource/Resource', ner: '', family: 'Resource' });

    const svg = d3.select(el),
      width = el?.getBoundingClientRect().width,
      height = el?.getBoundingClientRect().height;

    //appending little triangles, path object, as arrowhead
    //The <defs> element is used to store graphical objects that will be used at a later time
    //The <marker> element defines the graphic that is to be used for drawing arrowheads or polymarkers on a given <path>, <line>, <polyline> or <polygon> element.
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
      .attr('refX', 15) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')
      .style('stroke', 'none');

    simulation = d3
      .forceSimulation()
      .force(
        'link',
        d3
          .forceLink()
          .id((d) => (d as any)['id'])
          .distance(100),
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('marker-end', function (d) {
        return d.value === 1 ? null : 'url(#arrowhead)';
      })
      .attr('stroke', '#999')
      .attr('stroke-width', function (d) {
        return Math.sqrt(d.value);
      })
      .attr('stroke-opacity', function (d) {
        return d.value === 1 ? 0.2 : 0.6;
      })
      .style('visibility', function (d) {
        return !!displayedGroups[d.fromGroup] && !!displayedGroups[d.toGroup] ? 'visible' : 'hidden';
      });

    const drag = d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
    node = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('visibility', function (d) {
        return !!displayedGroups[d.family] ? 'visible' : 'hidden';
      })
      .call(drag as any);

    (node as any).append('circle').attr('r', 5).attr('stroke', '#fff').attr('fill', color);

    node
      .append('text')
      .attr('dx', 6)
      .text(function (d) {
        return d.ner;
      })
      .append('title')
      .text((d) => d.family);

    simulation.nodes(nodes as any).on('tick', ticked);

    (simulation as any).force('link').links(links);

    // link
    //   .append('text')
    //   .attr('transform', function (d) {
    //     if (d.source.x && d.target.x && d.source.y && d.target.y) {
    //       return 'translate(' + (d.source.y + d.target.y) / 2 + ',' + (d.source.x + d.target.x) / 2 + ')';
    //     } else {
    //       return null;
    //     }
    //   })
    //   .attr('dy', '.35em')
    //   .attr('text-anchor', 'middle')
    //   .text((d) => d.label || '');

    const edgepaths = svg
      .append('g')
      .attr('class', 'paths')
      .selectAll('.edgepath') //make path go along with the link provide position for link labels
      .data(links)
      .enter()
      .append('path')
      .attr('class', 'edgepath')
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .attr('id', function (d, i) {
        return 'edgepath' + i;
      })
      .style('pointer-events', 'none');

    edgelabels = svg
      .append('g')
      .attr('class', 'labels')
      .selectAll('.edgelabel')
      .data(links)
      .enter()
      .append('text')
      .style('pointer-events', 'none')
      .attr('class', 'edgelabel')
      .style('visibility', function (d) {
        return !!displayedGroups[d.family] ? 'visible' : 'hidden';
      })
      .attr('id', function (d, i) {
        return 'edgelabel' + i;
      })
      .attr('font-size', 10)
      .attr('fill', '#aaa');

    edgelabels
      .append('textPath') //To render text along the shape of a <path>, enclose the text in a <textPath> element that has an href attribute with a reference to the <path> element.
      .attr('xlink:href', function (d, i) {
        return '#edgepath' + i;
      })
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .attr('startOffset', '50%')
      .text((d) => d.label || '');

    function ticked() {
      node.attr('transform', function (d: any) {
        return 'translate(' + d.x + ',' + d.y + ')';
      });
      link
        .attr('x1', function (d) {
          return d.source.x;
        })
        .attr('y1', function (d) {
          return d.source.y;
        })
        .attr('x2', function (d) {
          return d.target.x;
        })
        .attr('y2', function (d) {
          return d.target.y;
        });
      edgepaths.attr('d', (d) => 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y);
    }
  }

  function dragstarted(event, d) {
    if (!event.active) (simulation as any).alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  const toggleGroup = (group: string) => {
    displayedGroups[group] = !displayedGroups[group];
    node.style('visibility', function (d) {
      return !!displayedGroups[d.family] ? 'visible' : 'hidden';
    });
    link.style('visibility', function (d) {
      return !!displayedGroups[d.fromGroup] && !!displayedGroups[d.toGroup] ? 'visible' : 'hidden';
    });
    edgelabels.style('visibility', function (d) {
      return !!displayedGroups[d.fromGroup] && !!displayedGroups[d.toGroup] ? 'visible' : 'hidden';
    });
  };
</script>

<div class="container">
  <svg
    bind:this={el}
    height="500" />
  <div class="groups">
    {#each groups as group}
      <div class="group">
        <input
          type="checkbox"
          bind:group={displayedGroupList}
          value={group}
          on:change={() => toggleGroup(group)} />
        <span>{group}</span>
      </div>
    {/each}
  </div>
</div>

<style
  lang="scss"
  src="./KnowledgeGraph.scss"></style>
