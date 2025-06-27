"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Label as RechartsLabel,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import { convertFileSize } from "@/lib/utils";

// Types
interface ChartProps {
  used?: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface ViewBoxProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
}

// Constants
const TOTAL_STORAGE = 2 * 1024 * 1024 * 1024;
const COLORS = ["#FFFFFFCC", "#ffffff44"];

const chartConfig = {
  size: { label: "Size" },
  used: { label: "Used", color: "white" },
} satisfies ChartConfig;

export const Chart = ({ used = 0 }: ChartProps) => {
  const rawPercentage = (used / TOTAL_STORAGE) * 100;
  const percentageUsed = Math.min(
    used > 0 ? Math.max(Number(rawPercentage.toFixed(2)), 0.01) : 0,
    100
  );

  const data: ChartData[] = [
    { name: "Used", value: percentageUsed },
    { name: "Remaining", value: 100 - percentageUsed },
  ];

  const getCenterCoordinates = (viewBox: ViewBoxProps) => {
    if (viewBox.cx !== undefined && viewBox.cy !== undefined) {
      return { cx: viewBox.cx, cy: viewBox.cy };
    }

    const x = viewBox.x || 0;
    const y = viewBox.y || 0;
    const width = viewBox.width || 0;
    const height = viewBox.height || 0;

    return {
      cx: x + width / 2,
      cy: y + height / 2,
    };
  };

  return (
    <Card className="chart">
      <CardContent className="flex-1 p-0">
        <ChartContainer config={chartConfig} className="chart-container">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                innerRadius={80}
                outerRadius={110}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}

                <RechartsLabel
                  position="center"
                  content={({ viewBox }) => {
                    if (!viewBox) return null;

                    const { cx, cy } = getCenterCoordinates(viewBox as ViewBoxProps);

                    return (
                      <g>
                        <text
                          x={cx}
                          y={cy - 5}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="24"
                          fontWeight="bold"
                          className="chart-total-percentage"
                        >
                          {percentageUsed < 1 && percentageUsed > 0
                            ? `${percentageUsed}%`
                            : `${Math.round(percentageUsed)}%`
                          }
                        </text>
                        <text
                          x={cx}
                          y={cy + 18}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="rgba(255,255,255,0.8)"
                          fontSize="14"
                          fontWeight="500"
                        >
                          Space used
                        </text>
                      </g>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardHeader className="chart-details">
        <CardTitle className="chart-title">Available Storage</CardTitle>
        <CardDescription className="chart-description">
          {used > 0 ? convertFileSize(used) : "0 B"} / {convertFileSize(TOTAL_STORAGE)}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};