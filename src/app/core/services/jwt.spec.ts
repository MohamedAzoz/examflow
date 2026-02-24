import { TestBed } from '@angular/core/testing';

import { JWT } from './jwt';

describe('JWT', () => {
  let service: JWT;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JWT);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
