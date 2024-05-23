import { Component, OnInit, ViewChild } from "@angular/core";
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
import { LabelData, DayData, LabelCount } from "../../interfaces/dataresponse";

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
  selector: 'app-model-performance',
  templateUrl: './model-performance.component.html',
  styleUrls: ['./model-performance.component.css']
})
export class ModelPerformanceComponent {
  @ViewChild("chart") chart: ChartComponent | undefined;
  public chartOptions: Partial<ChartOptions> | any;

  datapoints: ApexAxisChartSeries = [];
  days: string[] = [];

  constructor(private theme: ThemeService, private route: ActivatedRoute, private data: AnalyticsdataService) {}

  async ngOnInit(): Promise<void> {
    await this.loadChartData().then(() => {
      this.renderChart();
    });
  }

  randomizeArray(arg: number[]) {
    var array = arg.slice();
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

  sparklineData: number[] = [47, 45, 54, 38, 56, 24, 65, 31, 37, 39, 62, 51, 35, 41, 35, 27, 93, 53, 61, 27, 54, 43, 19, 46];

  // Instantiating the chart
  renderChart() {
    const dateLabels = [...Array(24).keys()].map(n => `2018-09-${String(n + 1).padStart(2, '0')}`);

    this.chartOptions = {
      series: [{
        name: 'Sales',
        data: this.sparklineData.map((value, index) => ({
          x: new Date(dateLabels[index]).getTime(),
          y: value
        }))
      }],
      chart: {
        id: 'sparkline1',
        group: 'sparklines',
        type: 'area',
        height: 290,
        width: 360,
        sparkline: {
          enabled: true
        },
      },
      stroke: {
        curve: 'straight'
      },
      fill: {
        opacity: 1,
      },
      xaxis: {
        type: 'datetime',
      },
      yaxis: {
        min: 0
      },
      colors: [this.theme.color_monochrome],
      title: {
        text: 'server load: 14%',
        offsetX: 10,
        offsetY: 10,
        style: {
          fontSize: '24px',
          cssClass: 'apexcharts-yaxis-title'
        }
      },
      subtitle: {
        text: 'Sales',
        offsetX: 30,
        style: {
          fontSize: '14px',
          cssClass: 'apexcharts-yaxis-title'
        }
      }
    }
  }

  // loading the data
  async loadChartData(): Promise<void> {
    this.datapoints = [];
    this.days = [];

    const responseData: LabelData = await this.data.getDataBetween(undefined, undefined); 

    // Initialize an object to hold the aggregated data
    const evaluationCounts: { [label: string]: number[] } = {};

    responseData.data.forEach((dayData: DayData) => {
      // add date
      this.days.push(dayData.date);

      // iterate through labels and adding counts
      dayData.labels_count.forEach((labelCount: LabelCount) => {
        // converting label name to lowercase and removing spaces
        const label = labelCount.label.replace('_', ' ').toLowerCase();
        // if label name isn't present in counts yet
        if (!evaluationCounts[label]) {
          evaluationCounts[label] = [];
        }
        evaluationCounts[label].push(labelCount.evaluation);
      });
    });

    // Transform the aggregated data into the desired format
    Object.entries(evaluationCounts).forEach(([name, data]) => {
      this.datapoints.push({ name, data });
    });
  }
}

