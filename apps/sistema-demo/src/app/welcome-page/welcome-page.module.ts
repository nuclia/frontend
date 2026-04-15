import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomePageComponent } from './welcome-page.component';
import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';

@NgModule({
  declarations: [WelcomePageComponent],
  imports: [CommonModule, PaDemoModule],
})
export class WelcomePageModule {}
