import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [CommonModule, RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class SessionsComponent {}
