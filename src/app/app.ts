import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Loading } from './layout/loading/loading';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { UpdateService } from './core/services/update-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Loading, Toast, ConfirmDialog],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('ExamFlow');
  private readonly updateService = inject(UpdateService);

  ngOnInit(): void {
    this.updateService.init();
  }
}
