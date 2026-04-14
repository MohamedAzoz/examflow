import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Loading } from './layout/loading/loading';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from "primeng/confirmdialog";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loading, Toast, ConfirmDialog],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('examflow');
}
