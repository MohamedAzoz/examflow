import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfessorsTable } from './professors-table';

describe('ProfessorsTable', () => {
  let component: ProfessorsTable;
  let fixture: ComponentFixture<ProfessorsTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfessorsTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfessorsTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
