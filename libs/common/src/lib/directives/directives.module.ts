import { NgModule } from '@angular/core';

import { STFPerfectScrollbarDirective } from './perfect-scroll/perfect-scrollbar.directive';

@NgModule({
  declarations: [STFPerfectScrollbarDirective],
  exports: [STFPerfectScrollbarDirective],
})
export class STFDirectivesModule {}
