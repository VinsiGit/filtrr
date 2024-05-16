import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { ThemeService } from "../../services/theme.service";

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexMarkers,
  ApexDataLabels,
  ApexTitleSubtitle,
  ApexStroke,
  ApexGrid,
  ApexFill,
  ApexLegend,
  ApexYAxis,
} from "ng-apexcharts";
import { ActivatedRoute } from "@angular/router";
import { AnalyticsdataService } from "../../services/analyticsdata.service";
import { LabelData, DayData } from "../../interfaces/dataresponse";

export interface ChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  fill: ApexFill;
  markers: ApexMarkers;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  colors: any;
  stroke: ApexStroke;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
};


@Component({
  selector: 'app-certaintygraph',
  templateUrl: './certaintygraph.component.html',
  styleUrls: ['./certaintygraph.component.css']
})
export class CertaintygraphComponent {
  @Input() title: string | undefined;
  @Input() labelIndex: string = "0";
  @Input() dataUrl: string | undefined;
  certainty: number = 0;
  label: string | undefined = undefined;
  labelColor: string = "";

  @ViewChild("chart") chart: ChartComponent | undefined;
  public chartOptions: Partial<ChartOptions> | any;


  datapoints: number[] = [];
  totalAvg: number = 0;
  months: string[] = [];


  constructor(private theme: ThemeService, private route: ActivatedRoute, private data: AnalyticsdataService) {
  }

  async ngOnInit(): Promise<void> {
    this.labelColor = this.theme.labelcolors[+this.labelIndex];

    if (this.title) {
      this.label = this.title.replace('-', '_').toUpperCase();
    }

    await this.loadChartData().then(() => {
      this.renderChart();
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  //instanciating the chart
  renderChart() {
    this.chartOptions = {
      series: [
        {
          name: this.title,
          data: this.datapoints,
        },
      ],
      chart: {
        foreColor: "#fff",
        redrawOnParentResize: true,
        id: `certaintyGraph-${this.data.labels[+this.labelIndex]}`,
        type: 'line'
      },
      colors: [getComputedStyle(document.documentElement).getPropertyValue('--module-color-highlight-monochrome')],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 3,
      },
      title: {
        text: "certainty",
        align: "left",
      },
      grid: {
        show: false
      },
      xaxis: {
        type: 'datetime',
        categories: this.months,
        axisBorder: {
          show: false,
        },
        labels: {
          rotate: 45,
          format: 'MMM \'yy',
          style: {
            colors: this.theme.certainty_gridtext[+this.labelIndex],
          },
        },
      },
      yaxis: {
        labels: {
          formatter: function (val: any) {
            return `${val}%`
          },
          style: {
            colors: this.theme.certainty_gridtext[+this.labelIndex],
          },
        },
      },
      markers: {
        size: 0,
        hover: {
          size: 4,
        },
      },
    };
  }

  async loadChartData(): Promise<void> {
    this.datapoints = [];
    this.months = [];

    const today: Date = new Date();
    today.setDate(today.getDate() + 1);
    const oneYearAgo: Date = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const responseData: LabelData = await this.data.getDataBetween([oneYearAgo, today], this.label);

    let totalSum = 0;
    let totalCounter = 1;
    let monthSum = 0;
    let dayCounter = 1;
    let prevDate = `${oneYearAgo.getFullYear()}-${oneYearAgo.getMonth()+1}`;
    this.months = [this.formatDate(oneYearAgo)]

    responseData.data.forEach((dayData: DayData) => {
      const monthKey: string = dayData.date.slice(0, 7); // Extract YYYY-MM

      dayData.labels_count.forEach(labelCount => {
        //TODO: remove conditional when label filter is implemented in backend
        if ((labelCount.label == this.label) && (labelCount.average_confidence != 0)){
          totalSum += labelCount.average_confidence;
          monthSum += labelCount.average_confidence;
          dayCounter += 1;
          totalCounter += 1;
        }
      });

      if ((prevDate != monthKey) || (dayData.date == this.formatDate(today))){
        this.datapoints.push(Math.round(((monthSum / dayCounter)*100) * 100) / 100);
        dayCounter = 1;
        monthSum = 0;
        this.months.push(dayData.date);
      }

      prevDate = monthKey;

    });

    this.certainty = Math.round(((totalSum / totalCounter)*100) * 100) / 100;
  }
}
