import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HomeComponent } from './home.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [CommonModule, PaButtonModule, RouterModule, TranslateModule],
  exports: [HomeComponent],
  declarations: [HomeComponent],
  providers: [],
})
export class HomeModule {}
