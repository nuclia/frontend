import { Component, OnInit, Input } from '@angular/core';

export enum SetupStep {
  Password,
  Account,
  Upload,
}

@Component({
  selector: 'app-setup-header',
  templateUrl: './setup-header.component.html',
  styleUrls: ['./setup-header.component.scss'],
})
export class SetupHeaderComponent implements OnInit {
  @Input() step: SetupStep = SetupStep.Password;
  @Input() isSignup: boolean = false;
  setupStep = SetupStep;

  constructor() {}

  ngOnInit(): void {}
}
