import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'stf-user-error',
  templateUrl: './user-error.component.html',
  styleUrls: ['./user-error.component.scss'],
})
export class UserErrorComponent implements OnInit {
  @Input() message: string = '';

  constructor() {}

  ngOnInit(): void {}
}
