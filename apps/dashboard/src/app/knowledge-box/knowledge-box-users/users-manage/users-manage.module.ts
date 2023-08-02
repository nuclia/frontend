import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaDropdownModule, PaTableModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent } from '@nuclia/sistema';
import { UsersManageComponent } from './users-manage.component';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    FormsModule,
    PaButtonModule,
    PaDropdownModule,
    DropdownButtonComponent,
    PaTableModule,
    PaTextFieldModule,
  ],
  declarations: [UsersManageComponent],
  exports: [UsersManageComponent],
})
export class UsersManageModule {}
