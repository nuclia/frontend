import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InfoCardComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { Subject, takeUntil } from 'rxjs';
import { ExternalIndexProvider, PINECONE_REGIONS } from '@nuclia/core';

export interface VectorDbModel {
  external: boolean;
  type: 'pinecone';
  apiKey: string;
  pinecone: {
    cloud: 'aws' | 'gcp_us_central1' | 'azure_eastus2';
    awsRegion: 'aws_us_east_1' | 'aws_us_west_2' | 'aws_eu_west_1';
  };
}

export function vectorDbToIndexProvider(vectorDatabase: VectorDbModel): ExternalIndexProvider | null {
  if (!vectorDatabase.external) {
    return null;
  }

  let serverless_cloud: 'aws' | PINECONE_REGIONS = vectorDatabase.pinecone.cloud;
  if (serverless_cloud === 'aws') {
    serverless_cloud = vectorDatabase.pinecone.awsRegion;
  }
  return {
    type: vectorDatabase.type,
    api_key: vectorDatabase.apiKey,
    serverless_cloud,
  };
}

@Component({
  selector: 'nus-vector-database-form',
  imports: [CommonModule, ReactiveFormsModule, InfoCardComponent, TranslateModule, PaTogglesModule, PaTextFieldModule],
  templateUrl: './vector-database-form.component.html',
  styleUrl: './vector-database-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VectorDatabaseFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll: Subject<void> = new Subject<void>();

  @Input() set vectorDb(value: VectorDbModel | undefined) {
    if (value) {
      this.form.patchValue(value);
    }
  }

  @Output() vectorDbChange = new EventEmitter<VectorDbModel>();
  @Output() indexProviderUpdated = new EventEmitter<ExternalIndexProvider | null>();

  form = new FormGroup({
    external: new FormControl<boolean>(false, { nonNullable: true }),
    type: new FormControl<'pinecone'>('pinecone', { nonNullable: true }),
    apiKey: new FormControl<string>('', { nonNullable: true }),
    pinecone: new FormGroup({
      cloud: new FormControl<'aws' | 'gcp_us_central1' | 'azure_eastus2'>('gcp_us_central1', { nonNullable: true }),
      awsRegion: new FormControl<'aws_us_east_1' | 'aws_us_west_2' | 'aws_eu_west_1'>('aws_us_east_1', {
        nonNullable: true,
      }),
    }),
  });

  get externalVectorDatabase() {
    return this.form.controls.external.value;
  }
  get pineconeCloudControl() {
    return this.form.controls.pinecone.controls.cloud;
  }
  get pineconeCloudValue() {
    return this.pineconeCloudControl.value;
  }

  ngOnInit() {
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      const vectorDatabase = this.form.getRawValue();
      this.vectorDbChange.next(vectorDatabase);
      this.indexProviderUpdated.next(vectorDbToIndexProvider(vectorDatabase));
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
