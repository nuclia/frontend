import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'stf-old-user-container',
  templateUrl: './old-user-container.component.html',
  styleUrls: ['./old-user-container.component.scss'],
})
export class OldUserContainerComponent implements OnInit {
  @Input() widthSm: string = '450px';
  @Input() showLink: boolean = false;

  constructor() {}

  ngOnInit(): void {}
}
