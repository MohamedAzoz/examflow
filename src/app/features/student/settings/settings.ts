import { Component } from '@angular/core';
import { SettingsPageComponent } from '../../../shared/components/settings-page/settings-page.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [SettingsPageComponent],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {

}
