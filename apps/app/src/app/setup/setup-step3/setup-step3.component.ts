import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { timer } from 'rxjs';
import { SetupStep } from '../setup-header/setup-header.component';

@Component({
  selector: 'app-setup-step3',
  templateUrl: './setup-step3.component.html',
  styleUrls: ['./setup-step3.component.scss']
})
export class SetupStep3Component implements OnInit {
  step = SetupStep.Upload;
  isSignup: boolean = false;

  loading: boolean = false;
  uploaded: boolean = false;

  @ViewChild('file') file: ElementRef | undefined;

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.isSignup = this.route.snapshot.queryParams.signup === 'true';
  }

  chooseFile(event: Event) {
    this.file?.nativeElement.click();

    this.loading = true;
    // TODO: disable file input
    timer(6000).subscribe(() => {
      this.loading = false;
      this.uploaded = true;
    });

  }
}
