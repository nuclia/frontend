import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';

import { TooltipComponent } from './tooltip.component';
import { TooltipDirective } from './tooltip.directive';
import { EllipsisTooltipDirective, ExtendedTooltipDirective } from './ellipsis-tooltip.directive';

@NgModule({
  imports: [CommonModule, OverlayModule, TranslateModule.forChild()],
  declarations: [
    TooltipComponent,
    TooltipDirective,
    EllipsisTooltipDirective,
    ExtendedTooltipDirective
  ],
  exports: [
    TooltipComponent,
    TooltipDirective,
    EllipsisTooltipDirective,
    ExtendedTooltipDirective
  ],
})
export class STFTooltipModule {}