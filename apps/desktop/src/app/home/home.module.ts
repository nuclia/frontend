import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProgressBarModule } from '@flaps/common';
import { TranslateModule } from '@ngx-translate/core';

import { HomeComponent } from './home.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [CommonModule, RouterModule, TranslateModule, ProgressBarModule, PaButtonModule],
  exports: [],
  declarations: [HomeComponent],
  providers: [],
})
export class HomeModule {}
