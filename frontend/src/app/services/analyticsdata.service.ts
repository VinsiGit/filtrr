import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LabelData } from '../interfaces/dataresponse';
import { environment } from '../../environments/environment';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsdataService {
  labels: string[] = ["irrelevant", "bi-engineer", "data-engineer"];
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

  async getDataBetween(interval: Date[] | undefined, label: string | undefined): Promise<LabelData> {
    let queryParams = '';

    if (interval) {
      queryParams += `?start_date=${this.formatDate(interval[0])}`;
    }

    if (interval) {
      queryParams += `&end_date=${this.formatDate(interval[1])}`;
    }

    if (label) {
      if(interval){
        queryParams += `&label=${label}`;
      }
      else{
        queryParams += `?label=${label}`;
      }
    }

    return await this.getQueryData(queryParams);
  }
}
