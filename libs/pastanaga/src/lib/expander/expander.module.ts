import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpanderComponent, ExpanderContentDirective } from './expander.component';

@NgModule({
    imports: [CommonModule],
    declarations: [ExpanderComponent, ExpanderContentDirective],
    exports: [ExpanderComponent, ExpanderContentDirective],
})
export class STFExpanderModule {}
