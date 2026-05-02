import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class Support {
  private readonly http = inject(HttpClient);
  // POST
  // /api/Support/report-issue
  reportIssue(Priority: string, description: string, phoneNumber: string, image?: File) {
    const formData = new FormData();
    formData.append('Priority', Priority);
    formData.append('description', description);
    formData.append('phoneNumber', phoneNumber);
    if (image) {
      formData.append('image', image);
    }
    return this.http.post(`${environment.apiUrl}/Support/report-issue`, formData);
  }
}
