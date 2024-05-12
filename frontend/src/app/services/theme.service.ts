import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  labelcolors: string[] = ['#7961f1', "#6460af", "#b872de"];

  shadowcolor: string = "607D8B";
  shadowOpacity: number = 0.3;
  
  chart_gridcolor: string = "#f2f2f2";
  chart_textcolor: string = "#8e8ea7";
  chart_axistextcolor: string = "#8e8ea7";

  radial_textcolor: string = "#607d8b";
  radial_trackcolor: string = "#f5f4ff";
  radial_backgroundcolor: string = "#47426b";

  matrix_bordercolor: string = "#fcfdfe";
}