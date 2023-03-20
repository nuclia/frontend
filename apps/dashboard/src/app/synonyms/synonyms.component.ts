import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-synonyms',
  templateUrl: './synonyms.component.html',
  styleUrls: ['./synonyms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SynonymsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
