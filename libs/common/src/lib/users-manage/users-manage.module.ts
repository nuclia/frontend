import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  PaButtonModule,
  PaChipsModule,
  PaDropdownModule,
  PaIconModule,
  PaTableModule,
  PaTextFieldModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent, ExpandableTextareaComponent } from '@nuclia/sistema';
import { LowerCaseInputDirective } from '@flaps/core';
import { UsersManageComponent } from './users-manage.component';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    FormsModule,
    AccordionBodyDirective,
    AccordionComponent,
    AccordionItemComponent,
    PaButtonModule,
    PaChipsModule,
    PaDropdownModule,
    PaIconModule,
    DropdownButtonComponent,
    PaTableModule,
    PaTextFieldModule,
    PaTooltipModule,
    LowerCaseInputDirective,
    ExpandableTextareaComponent,
  ],
  declarations: [UsersManageComponent],
  exports: [UsersManageComponent],
})
export class UsersManageModule {}
