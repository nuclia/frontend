import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomeComponent } from './welcome/welcome.component';
import { RouterModule, Routes } from '@angular/router';
import { LoggedinGuard } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaCardModule } from '@guillotinaweb/pastanaga-angular';

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
    RouterModule.forChild(homeRoutes),
    TranslateModule.forChild(),
    PaButtonModule,
    PaCardModule,
  ],
  exports: [RouterModule],
})
export class HomeModule {}
