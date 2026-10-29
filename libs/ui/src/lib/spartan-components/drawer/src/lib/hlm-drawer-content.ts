import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { injectExposedSideProvider, injectExposesStateProvider } from '@spartan-ng/brain/core';
import { BrnDrawerHandle } from '@spartan-ng/brain/drawer';
import { classes } from '@nuclia/ui-spartan/utils';

@Component({
  selector: 'hlm-drawer-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: BrnDrawerHandle, inputs: ['closeThreshold'] }],
  host: {
    'data-slot': 'drawer-content',
    '[attr.data-vaul-drawer-direction]': '_sideProvider.side()',
    '[attr.data-state]': 'state()',
  },
  template: `
    <div
      class="bg-muted mx-auto mt-4 hidden h-1 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block"></div>
    <ng-content />
  `,
})
export class HlmDrawerContent {
  private readonly _stateProvider = injectExposesStateProvider({ host: true });
  protected readonly _sideProvider = injectExposedSideProvider({ host: true });
  public readonly state = this._stateProvider.state ?? signal('closed');

  constructor() {
    classes(() => [
      'bg-background fixed z-50 flex h-auto flex-col text-sm data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-xl data-[vaul-drawer-direction=bottom]:border-t data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:rounded-r-xl data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:rounded-l-xl data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-xl data-[vaul-drawer-direction=top]:border-b data-[vaul-drawer-direction=left]:sm:max-w-sm data-[vaul-drawer-direction=right]:sm:max-w-sm',
      'group/drawer-content',
      'data-open:animate-in data-closed:animate-out',
      'data-[vaul-drawer-direction=bottom]:data-closed:slide-out-to-bottom data-[vaul-drawer-direction=bottom]:data-open:slide-in-from-bottom',
      'data-[vaul-drawer-direction=top]:data-closed:slide-out-to-top data-[vaul-drawer-direction=top]:data-open:slide-in-from-top',
      'data-[vaul-drawer-direction=left]:data-closed:slide-out-to-left data-[vaul-drawer-direction=left]:data-open:slide-in-from-left',
      'data-[vaul-drawer-direction=right]:data-closed:slide-out-to-right data-[vaul-drawer-direction=right]:data-open:slide-in-from-right',
    ]);
  }
}
