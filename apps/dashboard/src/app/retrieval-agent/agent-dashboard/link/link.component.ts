import { booleanAttribute, Component, computed, HostBinding, Input, input } from '@angular/core';

let count = 0;
const defaultSize = 116;

@Component({
  selector: 'app-link',
  template: `
    <svg
      [id]="id"
      [attr.width]="width"
      [attr.height]="height()"
      [attr.viewBox]="viewbox()"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <g>
        <path
          [attr.d]="d()"
          stroke="#707070"
          stroke-width="1.5"
          stroke-linecap="round" />
      </g>
    </svg>
  `,
  styles: `:host {
    position: absolute; 
  }`,
})
export class LinkComponent {
  readonly id = `link-${count++}`;
  readonly width = defaultSize;

  @HostBinding('style.left.px') @Input() left: number = 0;
  @HostBinding('style.top.px') @Input() top?: number;

  goDown = input(false, { transform: booleanAttribute });
  height = input(defaultSize);

  viewbox = computed(() => `0 0 ${this.width} ${this.height()}`);
  d = computed(() => {
    const dy = this.height() - 1;
    const dx = (75 * this.height()) / defaultSize;
    const width = this.width - 3;
    return this.goDown() ? `M2 1 C51 1 88 ${dy} ${width} ${dy}` : `M2 ${dy} C${dx} ${dy} ${dx} 1 ${width} 1`;
  });
}
