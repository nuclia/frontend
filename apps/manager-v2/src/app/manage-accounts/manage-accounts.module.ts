import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageAccountsComponent } from './manage-accounts.component';
import { RouterModule, Routes } from '@angular/router';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaDatePickerModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { AccountDetailsComponent } from './account-details/account-details.component';
import { AccountListComponent } from './account-list/account-list.component';
import { ConfigurationComponent } from './account-details/configuration/configuration.component';
import { KnowledgeBoxesComponent } from './account-details/knowledge-boxes/knowledge-boxes.component';
import { LimitsComponent } from './account-details/limits/limits.component';
import { UsersComponent } from './account-details/users/users.component';
import { KbDetailsComponent } from './account-details/kb-details/kb-details.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BlockedFeaturesComponent } from './account-details/blocked-features/blocked-features.component';
import { FormFooterComponent } from './form-footer/form-footer.component';
import { FeatureNamePipe } from './account-details/blocked-features/feature-name.pipe';
import { TokenConsumptionComponent } from './account-details/token-consumption/token-consumption.component';
import { PaymentLinksComponent } from './account-details/payment-links/payment-links.component';
import { STFPipesModule } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { AddAccountComponent } from './add-account/add-account.component';

const ROUTES: Routes = [
  {
    path: '',
    component: ManageAccountsComponent,
    children: [
      {
        path: '',
        component: AccountListComponent,
      },
      {
        path: 'add',
        component: AddAccountComponent,
      },
      {
        path: ':accountId',
        component: AccountDetailsComponent,
        children: [
          {
            path: '',
            redirectTo: 'config',
            pathMatch: 'full',
          },
          {
            path: 'config',
            component: ConfigurationComponent,
          },
          {
            path: 'kbs',
            component: KnowledgeBoxesComponent,
          },
          {
            path: 'zone/:zoneId/kb/:kbId',
            component: KbDetailsComponent,
          },
          {
            path: 'limits',
            component: LimitsComponent,
          },
          {
            path: 'tokens',
            component: TokenConsumptionComponent,
          },
          {
            path: 'users',
            component: UsersComponent,
          },
          {
            path: 'payment-links',
            component: PaymentLinksComponent,
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ROUTES),
    PaTableModule,
    PaButtonModule,
    PaTextFieldModule,
    PaIconModule,
    PaTogglesModule,
    ReactiveFormsModule,
    FormsModule,
    PaPopupModule,
    PaDropdownModule,
    PaScrollModule,
    PaTooltipModule,
    PaIconModule,
    PaDateTimeModule,
    PaDatePickerModule,
    STFPipesModule,
    TranslateModule,
    InfoCardComponent,
    PaTogglesModule,
  ],
  declarations: [
    ManageAccountsComponent,
    AccountDetailsComponent,
    AccountListComponent,
    ConfigurationComponent,
    LimitsComponent,
    UsersComponent,
    KnowledgeBoxesComponent,
    KbDetailsComponent,
    BlockedFeaturesComponent,
    FormFooterComponent,
    FeatureNamePipe,
    PaymentLinksComponent,
  ],
})
export class ManageAccountsModule {}
