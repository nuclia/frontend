import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'stf-user-container',
  templateUrl: './user-container.component.html',
  styleUrls: ['./user-container.component.scss']
})
export class UserContainerComponent implements OnInit {
  @Input() widthSm: string = '450px';
  @Input() showLink: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
