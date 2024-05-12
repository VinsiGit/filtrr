import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { ThemeService } from "../services/theme.service";

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
import { AnalyticsdataService } from "../services/analyticsdata.service";
import { LabelData, DayData, LabelCount } from "../interfaces/dataresponse";

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
  @Input() labelColorIndex: string = "0";
  @Input() certainty: string | undefined = "80";
  @Input() dataUrl: string | undefined;
  labelColor: string = "";

  @ViewChild("chart") chart: ChartComponent | undefined;
  public chartOptions: Partial<ChartOptions> | any;

  
  datapoints: ApexAxisChartSeries = [];
  days: string[] = [];


  constructor(private theme: ThemeService, private route: ActivatedRoute, private data: AnalyticsdataService) {
  }

  async ngOnInit(): Promise<void> {
    await this.loadChartData().then(() => {
      this.renderChart();
    });
    console.log(this.labelColorIndex);
    console.log(this.labelColor);
    this.labelColor = this.theme.labelcolors[+this.labelColorIndex];
  }

  //instanciating the chart
  renderChart() {
    this.chartOptions = {
      series: this.datapoints,
      chart: {
        foreColor: "#fff",
        redrawOnParentResize: true,
        id: "mailAmountGraph",
        type: 'line'
      },
      colors: [getComputedStyle(document.documentElement).getPropertyValue('--module-color-highlight-monochrome')],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 4,
      },
      title: {
        text: "mails",
        align: "left",
      },
      grid: {
        show: false
      },
      xaxis: {
        type: 'datetime',
        categories: this.days,
        axisBorder: {
          show: false,
        },
        labels: {
          rotate: 45,
          style: {
            colors: this.theme.chart_axistextcolor,
          },
        },
      },
      yaxis: {
        stepSize: 1,
        labels: {
          style: {
            colors: this.theme.chart_axistextcolor,
          },
        },
      },
      markers: {
        size: 1,
        hover: {
          size: 6,
        },
      },
    };
  }

  //TODO: change out for query based fetching
  async loadChartData(): Promise<void> {
    this.datapoints = [];
    this.days = [];
  
    const responseData: LabelData = await this.data.getDataBetween(undefined, undefined);
    console.log(responseData);
  
    // Initialize an object to hold the aggregated data
    const counts: { [label: string]: number[] } = {};
  
    responseData.data.forEach((dayData: DayData) => {
      // add date
      this.days.push(dayData.date);
  
      // iterate through labels and adding counts
      dayData.labels_count.forEach((labelCount: LabelCount) => {
        // converting label name to lowercase and removing spaces
        const label = labelCount.label.replace('_', '-').toLowerCase();
        
        // Check if label matches this.title
        if (label === this.title) {
          // if label name isn't present in counts yet
          if (!counts[label]) {
            counts[label] = [];
          }
          counts[label].push(labelCount.count);
        }
      });
    });
  
    // Transform the aggregated data into the desired format
    Object.entries(counts).forEach(([name, data]) => {
      this.datapoints.push({ name, data });
    });
  }
  
}
