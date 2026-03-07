import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading';

@Component({
  selector: 'app-loading',
  imports: [],
  templateUrl: './loading.html',
  styleUrl: './loading.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loading {
 protected readonly loadingService = inject(LoadingService);
}
