import * as d3 from 'd3';

export function createYAxis(
  element: d3.Selection<SVGGElement, any, HTMLElement, any>,
  domain: [number, number],
  numTicks: number,
  width: number,
  height: number,
  margin: { top: number; bottom: number; left: number; right: number },
): d3.ScaleLinear<number, number> {
  const y = d3.scaleLinear().domain(domain).nice(numTicks).range([height, 0]);

  element
    .append('g')
    .attr('transform', `translate(${width + margin.right - 1}, 0)`)
    .attr('class', 'y-axis')
    .call(d3.axisLeft(y).tickArguments([numTicks]))
    .call((g) => g.select('.domain').remove())
    .call((g) => g.selectAll('.tick text').attr('x', 0).attr('dy', 11))
    .call((g) => g.selectAll('.tick line').attr('x2', -37));

  // Add grid lines
  element
    .selectAll('line.grid-line')
    .data(y.ticks(numTicks))
    .join('line')
    .attr('class', 'grid-line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', (d) => y(d)!)
    .attr('y2', (d) => y(d)!);

  return y;
}
