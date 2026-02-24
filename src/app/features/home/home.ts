import { Component, inject } from '@angular/core';
import { AuthFacade } from '../auth/services/auth-facade';
import { LocalStorage } from '../../core/services/local-storage';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  public localStorage = inject(LocalStorage);
}
