import { Component, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexChart,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexStroke
} from "ng-apexcharts";
import { AnalyticsdataService } from "../services/analyticsdata.service";
import { ThemeService } from "../services/theme.service";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  fill: any;
  colors: any;
  title: ApexTitleSubtitle;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  stroke: ApexStroke;
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-confusionmatrix',
  templateUrl: './confusionmatrix.component.html',
  styleUrls: ['./confusionmatrix.component.css']
})
export class ConfusionmatrixComponent {
  @ViewChild("chart") chart: ChartComponent | undefined;
  public chartOptions: Partial<ChartOptions> | any;
  
  constructor(private theme: ThemeService, private route: ActivatedRoute, private data: AnalyticsdataService) {
    this.chartOptions = {
      series: [
        {
          name: "irrelevant",
          data: [75, 14, 12],
        },
        {
          name: "data-engineer",
          data: [22, 60, 18],
        },
        {
          name: "bi-engineer",
          data: [17, 16, 67],
        },
      ],
      chart: {
        height: 300,
        width: 380,
        id: "confusionmatrix",
        type: "heatmap",
        foreColor: this.theme.chart_textcolor,
        redrawOnParentResize: true,
      },
      plotOptions: {
        heatmap: {
          radius: 20,
          reverseNegativeShade: false,
          shadeIntensity: 0.1
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: any) {
          return `${val}%`
        },
      },
      colors: this.theme.labelcolors,
      xaxis: {
        lines: {
          show: true
        },
        labels: {
          trim: true,
        },
        type: "category",
        categories: ["irrelevant", "data-engineer", "bi-engineer"],
      },
      yaxis: {
        labels: {
          align: 'right',
          maxWidth: 50
        },
      },
      title: {
        text: "confusion matrix",
        align: 'left'
      },
      grid: {
        show: false,
        padding: {
          right: 20,
        },
      },
      stroke: {
        show: true,
        colors: this.theme.matrix_bordercolor,
        width: 2,
      }
    };
  }
}
  
