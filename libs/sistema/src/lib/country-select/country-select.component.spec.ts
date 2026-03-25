import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockModule } from 'ng-mocks';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

import { CountrySelectComponent } from './country-select.component';
import { COUNTRIES } from '@nuclia/sistema';

describe('CountrySelectComponent', () => {
  let component: CountrySelectComponent;
  let fixture: ComponentFixture<CountrySelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountrySelectComponent, MockModule(PaTextFieldModule)],
    }).compileComponents();

    fixture = TestBed.createComponent(CountrySelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── 1. Component creation ─────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate countryList from COUNTRIES', () => {
    const expectedLength = Object.keys(COUNTRIES).length;
    expect(component.countryList.length).toBe(expectedLength);
  });

  it('should give each entry code, name and flag properties', () => {
    const entry = component.countryList[0];
    expect(entry).toHaveProperty('code');
    expect(entry).toHaveProperty('name');
    expect(entry).toHaveProperty('flag');
  });

  it('should sort countryList alphabetically by name', () => {
    const names = component.countryList.map((c) => c.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  // ── 2. countryCodeToFlag (verified via countryList) ───────────────────────

  it('should produce the 🇺🇸 flag for US', () => {
    const us = component.countryList.find((c) => c.code === 'US');
    expect(us?.flag).toBe('🇺🇸');
  });

  it('should produce the 🇬🇧 flag for GB', () => {
    const gb = component.countryList.find((c) => c.code === 'GB');
    expect(gb?.flag).toBe('🇬🇧');
  });

  it('should produce the 🇪🇸 flag for ES', () => {
    const es = component.countryList.find((c) => c.code === 'ES');
    expect(es?.flag).toBe('🇪🇸');
  });

  // ── 3. ControlValueAccessor — writeValue ─────────────────────────────────

  it('writeValue should set innerControl value', () => {
    component.writeValue('US');
    expect((component as any).innerControl.value).toBe('US');
  });

  it('writeValue with empty string should set innerControl to empty string', () => {
    component.writeValue('US');
    component.writeValue('');
    expect((component as any).innerControl.value).toBe('');
  });

  it('writeValue with null should set innerControl to empty string (null safety)', () => {
    component.writeValue(null as any);
    expect((component as any).innerControl.value).toBe('');
  });

  it('writeValue should not emit a valueChanges event', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);
    component.writeValue('DE');
    expect(onChange).not.toHaveBeenCalled();
  });

  // ── 4. ControlValueAccessor — onChange propagation ───────────────────────

  it('should call registered onChange when innerControl value changes', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    (component as any).innerControl.setValue('DE');

    expect(onChange).toHaveBeenCalledWith('DE');
  });

  it('should call onChange with empty string when innerControl is set to empty string', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    (component as any).innerControl.setValue('');

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should NOT call registered onTouched when innerControl value changes', () => {
    const onTouched = jest.fn();
    component.registerOnTouched(onTouched);

    (component as any).innerControl.setValue('FR');

    expect(onTouched).not.toHaveBeenCalled();
  });

  it('should call registered onTouched when onTouched() is called directly (simulates blur)', () => {
    const onTouched = jest.fn();
    component.registerOnTouched(onTouched);

    (component as any).onTouched();

    expect(onTouched).toHaveBeenCalled();
  });

  // ── 5. ControlValueAccessor — setDisabledState ───────────────────────────

  it('setDisabledState(true) should disable innerControl', () => {
    component.setDisabledState(true);
    expect((component as any).innerControl.disabled).toBe(true);
  });

  it('setDisabledState(false) should enable innerControl', () => {
    component.setDisabledState(true);
    component.setDisabledState(false);
    expect((component as any).innerControl.disabled).toBe(false);
  });

  it('setDisabledState should not emit a valueChanges event', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    component.setDisabledState(true);
    component.setDisabledState(false);

    expect(onChange).not.toHaveBeenCalled();
  });

  // ── 6. Signal inputs — defaults ──────────────────────────────────────────

  it('readonly input should default to false', () => {
    expect(component.readonly()).toBe(false);
  });

  it('externalLabel input should default to false', () => {
    expect(component.externalLabel()).toBe(false);
  });

  it('should reflect readonly input set to true', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    expect(component.readonly()).toBe(true);
  });

  it('should reflect externalLabel input set to true', () => {
    fixture.componentRef.setInput('externalLabel', true);
    fixture.detectChanges();
    expect(component.externalLabel()).toBe(true);
  });
});
