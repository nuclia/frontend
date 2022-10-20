import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelDropdownComponent } from './label-dropdown.component';
import { MockComponent, MockModule } from 'ng-mocks';
import { PaDropdownModule } from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent } from '@nuclia/sistema';

describe('LabelDropdownComponent', () => {
  let component: LabelDropdownComponent;
  let fixture: ComponentFixture<LabelDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaDropdownModule), MockComponent(DropdownButtonComponent)],
      declarations: [LabelDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LabelDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
