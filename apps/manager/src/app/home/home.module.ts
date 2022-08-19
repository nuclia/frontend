import { STFButtonsModule } from '@flaps/pastanaga';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './welcome/welcome.component';
import { RouterModule, Routes } from '@angular/router';
import { LoggedinGuard } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

const homeRoutes: Routes = [
  {
    path: '',
    canActivateChild: [LoggedinGuard],
    children: [{ path: '', component: WelcomeComponent }],
  },
];

@NgModule({
  declarations: [WelcomeComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,
    STFButtonsModule,
    FlexLayoutModule,
    RouterModule.forChild(homeRoutes),
    TranslateModule.forChild(),
    PaButtonModule,
  ],
  exports: [RouterModule],
})
export class HomeModule {}
