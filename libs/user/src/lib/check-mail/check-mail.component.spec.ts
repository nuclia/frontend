import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckMailComponent } from './check-mail.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MockComponent, MockModule } from 'ng-mocks';
import { UserContainerComponent } from '../user-container';
import { PaIconModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';

describe('CheckMailComponent', () => {
  let component: CheckMailComponent;
  let fixture: ComponentFixture<CheckMailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaIconModule), MockModule(PaTranslateModule), RouterTestingModule],
      declarations: [CheckMailComponent, MockComponent(UserContainerComponent)],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
