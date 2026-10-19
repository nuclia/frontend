import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PaDemoModule } from '../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/demo.module';

@Component({
    templateUrl: './welcome-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [PaDemoModule],
})
export class WelcomePageComponent {}
