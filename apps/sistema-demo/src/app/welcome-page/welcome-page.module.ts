import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WelcomePageComponent } from './welcome-page.component';
import { PaDemoModule } from '@guillotinaweb/pastanaga-angular/demo';

@NgModule({
    imports: [CommonModule, PaDemoModule, WelcomePageComponent],
})
export class WelcomePageModule {}
