import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'app-setup-farewell',
  templateUrl: './farewell.component.html',
  styleUrls: ['./farewell.component.scss'],
})
export class FarewellComponent {
  feedback = this.route.queryParamMap.pipe(map((params) => params.get('feedback') === 'true'));
  constructor(private route: ActivatedRoute) {}
}
