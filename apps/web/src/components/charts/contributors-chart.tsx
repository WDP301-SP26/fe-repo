'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

interface ContributorStat {
  author: string;
  commits: number;
  lines_added: number;
  lines_deleted: number;
  net_change: number;
}

interface ContributorsChartProps {
  data: ContributorStat[];
}

export function ContributorsChart({ data }: ContributorsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center h-[400px]">
        <CardTitle className="text-xl text-muted-foreground">
          No Activity Data Available
        </CardTitle>
        <CardDescription>
          We couldn't retrieve contributor statistics.
        </CardDescription>
      </Card>
    );
  }

  // Format data for Recharts, ensuring numeric values and safe access
  const chartData = data.map((item) => ({
    name: item.author,
    Additions: item.lines_added || 0,
    Deletions: item.lines_deleted || 0,
    Commits: item.commits || 0,
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Contributor Activity</CardTitle>
        <CardDescription>
          Lines of code added vs. deleted by team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                opacity={0.3}
              />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar
                dataKey="Additions"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
              <Bar
                dataKey="Deletions"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
