import { Component, OnInit, Input } from '@angular/core';
import { trigger, animate, style, transition } from '@angular/animations';

@Component({
  selector: 'stf-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0 }))
      ])
    ]),
  ]
})
export class 
TooltipComponent implements OnInit {
  @Input() text: string = '';
  @Input() maxWidth: string | undefined;

  constructor() { }

  ngOnInit(): void {
  }

}
