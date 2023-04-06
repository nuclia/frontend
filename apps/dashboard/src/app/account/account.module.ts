import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';

import { UserAvatarModule } from '@flaps/components';
import {
  ChartsModule,
  HintModule,
  NavbarModule,
  PipesModule,
  STFSidebarModule,
  TokenDialogModule,
} from '@flaps/common';

import { AccountHomeComponent } from './account-home/account-home.component';
import { AccountManageComponent } from './account-manage/account-manage.component';
import { AccountKbsComponent } from './account-kbs/account-kbs.component';
import { KbAddComponent } from './account-kbs/kb-add/kb-add.component';
import { UsersDialogComponent } from './account-kbs/users-dialog/users-dialog.component';
import { AccountNUAComponent } from './account-nua/account-nua.component';
import { ClientDialogComponent } from './account-nua/client-dialog/client-dialog.component';
import { AccountUsersComponent } from './account-users/account-users.component';
import { NuaActivityComponent } from './account-nua/nua-activity/nua-activity.component';
import { CdkTableModule } from '@angular/cdk/table';
import { UsersManageModule } from '../knowledge-box';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaModalModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent, SisProgressModule } from '@nuclia/sistema';
import { AccountDeleteComponent } from './account-manage/account-delete/account-delete.component';

const Components = [
  AccountHomeComponent,
  AccountManageComponent,
  AccountKbsComponent,
  KbAddComponent,
  UsersDialogComponent,
  AccountNUAComponent,
  ClientDialogComponent,
  AccountUsersComponent,
  AccountDeleteComponent,
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    OverlayModule,
    MatTableModule,
    UserAvatarModule,
    PipesModule,
    TokenDialogModule,
    ChartsModule,
    CdkTableModule,
    STFSidebarModule,
    NavbarModule,
    UsersManageModule,
    HintModule,
    PaButtonModule,
    PaTooltipModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaIconModule,
    DropdownButtonComponent,
    PaDropdownModule,
    SisProgressModule,
    PaTabsModule,
  ],
  declarations: [...Components, NuaActivityComponent],
  exports: [AccountHomeComponent, AccountManageComponent],
})
export class AccountModule {}
