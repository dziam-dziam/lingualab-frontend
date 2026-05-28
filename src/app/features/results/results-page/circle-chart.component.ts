import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

export interface ChartSlice {
  label: string;
  value: number;
  percent: string;
  color: string;
}

interface SVGSlice {
  startAngle: number;
  endAngle: number;
  label: string;
  percent: string;
  color: string;
  midAngle: number;
}

@Component({
  selector: "app-circle-chart",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./circle-chart.component.html",
  styleUrl: "./circle-chart.component.css",
})
export class CircleChartComponent {
  @Input() slices: ChartSlice[] = [];
  @Input() title: string = "";

  get svgSlices(): SVGSlice[] {
    const total = this.slices.reduce((sum, slice) => sum + slice.value, 0);
    if (total === 0) {
      return [
        {
          startAngle: 0,
          endAngle: 360,
          label: "No responses",
          percent: "0%",
          color: "#dbe3ef",
          midAngle: 180,
        },
      ];
    }

    let currentAngle = -90;
    return this.slices.map((slice) => {
      const percentValue = (slice.value / total) * 100;
      const sliceAngle = (percentValue / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      const midAngle = (startAngle + endAngle) / 2;
      currentAngle = endAngle;

      return {
        startAngle,
        endAngle,
        label: slice.label,
        percent: slice.percent,
        color: slice.color,
        midAngle,
      };
    });
  }

  get pathData(): string[] {
    const svgSlices = this.svgSlices;
    const cx = 60;
    const cy = 60;
    const innerRadius = 30;
    const outerRadius = 50;

    return svgSlices.map((slice) => {
      const startRad = (slice.startAngle * Math.PI) / 180;
      const endRad = (slice.endAngle * Math.PI) / 180;
      const isLarge = slice.endAngle - slice.startAngle > 180 ? 1 : 0;

      const x1 = cx + outerRadius * Math.cos(startRad);
      const y1 = cy + outerRadius * Math.sin(startRad);
      const x2 = cx + outerRadius * Math.cos(endRad);
      const y2 = cy + outerRadius * Math.sin(endRad);

      const x3 = cx + innerRadius * Math.cos(endRad);
      const y3 = cy + innerRadius * Math.sin(endRad);
      const x4 = cx + innerRadius * Math.cos(startRad);
      const y4 = cy + innerRadius * Math.sin(startRad);

      return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${isLarge} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${isLarge} 0 ${x4} ${y4} Z`;
    });
  }

  getPercentLabelPosition(slice: SVGSlice): { x: number; y: number } {
    const cx = 60;
    const cy = 60;
    const labelRadius = 38;
    const midRad = (slice.midAngle * Math.PI) / 180;

    return {
      x: cx + labelRadius * Math.cos(midRad),
      y: cy + labelRadius * Math.sin(midRad),
    };
  }

  shouldShowLabel(percentValue: number): boolean {
    return percentValue >= 6;
  }

  getPercentValue(slice: ChartSlice): number {
    const total = this.slices.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) return 0;
    return (slice.value / total) * 100;
  }
}
