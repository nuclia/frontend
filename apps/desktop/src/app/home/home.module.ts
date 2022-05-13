import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { STFButtonsModule } from '@flaps/pastanaga';
import { TranslateModule } from '@ngx-translate/core';

import { HomeComponent } from './home.component';

@NgModule({
  imports: [CommonModule, RouterModule, TranslateModule, STFButtonsModule],
  exports: [],
  declarations: [HomeComponent],
  providers: [],
})
export class HomeModule {}
