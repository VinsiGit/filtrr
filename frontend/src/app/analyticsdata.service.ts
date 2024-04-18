import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LabelData } from './interfaces/dataresponse';
import { environment } from '../environments/environment';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsdataService {

  hostname: string | undefined = environment.hostname;

  constructor(private http: HttpClient) { }

  private getQueryData(params: string): Promise<LabelData> {
    return lastValueFrom(this.http.get<LabelData>(`https://${this.hostname}/api/stats${params}`));
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getDataBetween(start_date: Date | undefined, end_date: Date | undefined): Promise<LabelData> {
    let queryParams = '';

    if (start_date) {
      queryParams += `?start_date=${this.formatDate(start_date)}&`;
    }

    if (end_date) {
      queryParams += `end_date=${this.formatDate(end_date)}`;
    }

    return await this.getQueryData(queryParams);
  }
}
