import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/demo.module';
import { NsiSkeletonComponent } from '../../../../../../libs/sistema/src/lib/skeleton/skeleton.component';

@Component({
    selector: 'nsd-sistema-skeleton',
    templateUrl: './sistema-skeleton.component.html',
    styleUrl: './sistema-skeleton.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [PaDemoModule, NsiSkeletonComponent],
})
export class SistemaSkeletonComponent {
  codeText = `<div class="skeleton-demo">
  <nsi-skeleton width="100%" height="1rem" borderRadius="small"></nsi-skeleton>
  <nsi-skeleton width="80%" height="1rem" borderRadius="small"></nsi-skeleton>
  <nsi-skeleton width="60%" height="1rem" borderRadius="small"></nsi-skeleton>
</div>`;

  codeAvatar = `<div class="skeleton-row">
  <nsi-skeleton width="40px" height="40px" borderRadius="round"></nsi-skeleton>
  <div class="skeleton-demo" style="flex: 1">
    <nsi-skeleton width="100%" height="1rem" borderRadius="small"></nsi-skeleton>
    <nsi-skeleton width="60%" height="1rem" borderRadius="small"></nsi-skeleton>
  </div>
</div>`;

  codeCard = `<nsi-skeleton width="100%" height="120px" borderRadius="medium"></nsi-skeleton>`;

  codeList = `<div class="skeleton-demo">
  <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]">
    <nsi-skeleton width="40px" height="1rem" borderRadius="small"></nsi-skeleton>
    <nsi-skeleton width="40%" height="1rem" borderRadius="small"></nsi-skeleton>
    <nsi-skeleton width="80px" height="1rem" borderRadius="small"></nsi-skeleton>
    <nsi-skeleton width="80px" height="1rem" borderRadius="small"></nsi-skeleton>
  </div>
</div>`;
}
