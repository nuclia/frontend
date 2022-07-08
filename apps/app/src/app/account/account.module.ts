import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';

import { TokenDialogModule } from '../components/token-dialog/token-dialog.module';
import { ButtonActionModule } from '../components/button-action/button-action.module';
import { PipesModule } from '../utils/pipes/pipes.module';
import { STFConfirmModule, UserAvatarModule } from '@flaps/components';
import { STFSectionNavbarModule, STFCheckboxModule, STFSidebarModule } from '@flaps/common';
import {
  STFButtonsModule,
  STFInputModule,
  STFTextFieldModule,
  STFFormDirectivesModule,
  STFTooltipModule,
  STFExpanderModule,
} from '@flaps/pastanaga';

import { AccountComponent } from './account.component';
import { AccountHomeComponent } from './account-home/account-home.component';
import { AccountManageComponent } from './account-manage/account-manage.component';
import { AccountKbsComponent } from './account-kbs/account-kbs.component';
import { KbAddComponent } from './account-kbs/kb-add/kb-add.component';
import { AccountNUAComponent } from './account-nua/account-nua.component';
import { ClientDialogComponent } from './account-nua/client-dialog/client-dialog.component';
import { AccountUsersComponent } from './account-users/account-users.component';
import { ChartsModule } from '../components/charts/charts.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NuaActivityComponent } from './account-nua/nua-activity/nua-activity.component';
import { CdkTableModule } from '@angular/cdk/table';
import { StashNavbarModule } from '../components/stash-navbar/stash-navbar.module';
import { HintModule } from '../components/hint/hint.module';
import { PaButtonModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';

const Components = [
  AccountComponent,
  AccountHomeComponent,
  AccountManageComponent,
  AccountKbsComponent,
  KbAddComponent,
  AccountNUAComponent,
  ClientDialogComponent,
  AccountUsersComponent,
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    OverlayModule,
    MatDialogModule,
    MatTableModule,
    STFSectionNavbarModule,
    STFCheckboxModule,
    STFConfirmModule,
    UserAvatarModule,
    STFButtonsModule,
    STFInputModule,
    STFTextFieldModule,
    STFFormDirectivesModule,
    STFTooltipModule,
    STFExpanderModule,
    ButtonActionModule,
    PipesModule,
    TokenDialogModule,
    ChartsModule,
    MatProgressSpinnerModule,
    CdkTableModule,
    STFSidebarModule,
    StashNavbarModule,
    HintModule,
    PaButtonModule,
    PaTooltipModule,
  ],
  declarations: [...Components, NuaActivityComponent],
  exports: [AccountComponent, AccountHomeComponent, AccountManageComponent],
})
export class AccountModule {}
