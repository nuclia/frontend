import * as d3 from 'd3';

export interface TickOptions {
  modulo?: number;
  displayTick?: boolean;
}

export function createYAxis(
  element: d3.Selection<SVGGElement, any, HTMLElement, any>,
  domain: [number, number],
  numTicks: number,
  width: number,
  height: number,
  margin: { top: number; bottom: number; left: number; right: number },
  yUnit?: string,
): d3.ScaleLinear<number, number> {
  const y = d3.scaleLinear().domain(domain).nice(numTicks).range([height, 0]);
  const rightSpace = margin.right - (yUnit ? 21 : 1);

  element
    .append('g')
    .attr('transform', `translate(${width + rightSpace}, 0)`)
    .attr('class', 'y-axis')
    .call(d3.axisLeft(y).tickArguments([numTicks]))
    .call((g) => g.select('.domain').remove())
    .call((g) => g.selectAll('.tick text').attr('x', 0).attr('dy', -4))
    .call((g) => g.selectAll('.tick line').attr('x2', -37));

  // Add grid lines
  element
    .selectAll('line.grid-line')
    .data(y.ticks(numTicks))
    .join('line')
    .attr('class', 'grid-line')
    .attr('x1', 0)
    .attr('x2', width + rightSpace)
    .attr('y1', (d) => y(d)!)
    .attr('y2', (d) => y(d)!);

  // Remove the grid line on top of the chart (which is cut otherwise)
  element.call((g) => g.select('.grid-line[y1="0"]').remove());

  // Add axis unit
  if (yUnit) {
    element
      .append('text')
      .attr('transform', `translate(${width + margin.right - 12}, ${height / 2}) rotate(90)`)
      .attr('y', 0)
      .attr('x', 0)
      .attr('class', 'unit')
      .style('text-anchor', 'middle')
      .text(yUnit);
  }

  return y;
}

export function drawThreshold(
  svg: d3.Selection<any, any, any, any>,
  threshold: number,
  width: number,
  y: d3.ScaleLinear<number, number>,
) {
  const t = y(threshold);
  if (typeof t === 'number') {
    svg
      .append('line')
      .style('stroke-dasharray', '5')
      .style('stroke-width', '2')
      .attr('class', 'threshold')
      .attr('x1', 0)
      .attr('y1', t)
      .attr('x2', width)
      .attr('y2', t);
  }
}
