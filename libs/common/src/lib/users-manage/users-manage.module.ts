import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
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
import { DropdownButtonComponent, ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { UsersManageComponent } from './users-manage.component';

@NgModule({
  imports: [
    CommonModule,

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
    InfoCardComponent,
    UsersManageComponent,
  ],
  exports: [UsersManageComponent],
})
export class UsersManageModule {}
