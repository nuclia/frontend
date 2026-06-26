import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  PaButtonModule,
  PaChipsModule,
  PaDropdownModule,
  PaIconModule,
  PaTableModule,
  PaTextFieldModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent, ExpandableTextareaComponent } from '@nuclia/sistema';
import { UsersManageComponent } from './users-manage.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    PaButtonModule,
    PaChipsModule,
    PaDropdownModule,
    PaIconModule,
    DropdownButtonComponent,
    PaTableModule,
    PaTextFieldModule,
    PaTooltipModule,
    ExpandableTextareaComponent,
  ],
  declarations: [UsersManageComponent],
  exports: [UsersManageComponent],
})
export class UsersManageModule {}
