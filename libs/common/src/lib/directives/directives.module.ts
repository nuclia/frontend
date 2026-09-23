import { NgModule } from '@angular/core';

import { STFPerfectScrollbarDirective } from './perfect-scroll/perfect-scrollbar.directive';

@NgModule({
    imports: [STFPerfectScrollbarDirective],
    exports: [STFPerfectScrollbarDirective],
})
export class STFDirectivesModule {}
