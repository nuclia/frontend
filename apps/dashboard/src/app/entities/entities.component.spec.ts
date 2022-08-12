import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslatePipeMock } from '@flaps/core';
import { of } from 'rxjs';
import { EntitiesService } from '../services/entities.service';

import { EntitiesComponent } from './entities.component';
import { MockModule } from 'ng-mocks';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

describe('EntitiesComponent', () => {
  let component: EntitiesComponent;
  let fixture: ComponentFixture<EntitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MockModule(PaTextFieldModule)],
      declarations: [EntitiesComponent, TranslatePipeMock],
      providers: [
        {
          provide: EntitiesService,
          useValue: {
            getEntities: () => of({}),
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
