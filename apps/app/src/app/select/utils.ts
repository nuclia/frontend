import { trigger, animate, style, transition, query, group } from '@angular/animations';

const duration = '350ms ease-in-out';

export const selectAnimations = [
  trigger('slideInOut', [
    transition('false => true', [
      style({ position: 'relative' }),
      query(':enter, :leave', [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
        }),
      ]),
      query(':enter', [style({transform: 'translateX(100%)', opacity: 0 })]),
      group([
        query(':leave', [animate(duration, style({ transform: 'translateX(-100%)', opacity: 0 }))]),
        query(':enter', [animate(duration, style({ transform: 'translateX(0)', opacity: 1 }))]),
      ]),
    ]),
    transition('true => false', [
      style({ position: 'relative' }),
      query(':enter, :leave', [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
        }),
      ]),
      query(':enter', [style({ transform: 'translateX(-100%)', opacity: 0 })]),
      group([
        query(':leave', [animate(duration, style({ transform: 'translateX(100%)', opacity: 0 }))]),
        query(':enter', [animate(duration, style({ transform: 'translateX(0)', opacity: 1 }))]),
      ]),
    ]),
  ]),
];
