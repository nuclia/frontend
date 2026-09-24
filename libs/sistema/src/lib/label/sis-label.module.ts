import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from './label.component';
import { PaChipsModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
    imports: [CommonModule, PaChipsModule, LabelComponent],
    exports: [LabelComponent],
})
export class SisLabelModule {}
