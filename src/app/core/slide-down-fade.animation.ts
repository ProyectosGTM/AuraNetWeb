import { animate, query, stagger, style, transition, trigger } from '@angular/animations';

export const slideDownFadeAnimation = trigger('slideDownFade', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateY(-15px)',
      maxHeight: '0',
      marginTop: '0',
      paddingTop: '0'
    }),
    animate(
      '0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      style({
        opacity: 1,
        transform: 'translateY(0)',
        maxHeight: '500px',
        marginTop: '12px',
        paddingTop: '12px'
      })
    )
  ]),
  transition(':leave', [
    animate(
      '0.3s ease-in',
      style({
        opacity: 0,
        transform: 'translateY(-10px)',
        maxHeight: '0',
        marginTop: '0',
        paddingTop: '0'
      })
    )
  ])
]);

export const staggerFadeInAnimation = trigger('staggerFadeIn', [
  transition(':enter', [
    query('.info-row', [
      style({
        opacity: 0,
        transform: 'translateX(-25px)'
      }),
      stagger('100ms', [
        animate(
          '0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({
            opacity: 1,
            transform: 'translateX(0)'
          })
        )
      ])
    ], { optional: true })
  ])
]);
