import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomePageComponent } from './welcome-page.component';
import { PaDemoModule } from '../../../../../libs/pastanaga-angular/projects/demo/src';

@NgModule({
  declarations: [WelcomePageComponent],
  imports: [CommonModule, PaDemoModule],
})
export class WelcomePageModule {}
