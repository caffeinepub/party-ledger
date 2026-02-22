import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { parseCategories } from '../../lib/categoryParser';
import { CATEGORY_COLORS, EVENT_CATEGORIES } from '../../lib/categories';
import type { PartyVisitRecord } from '../../backend';

interface CategoryPieChartProps {
  allVisits: Array<[string, any, PartyVisitRecord[]]>;
}

export default function CategoryPieChart({ allVisits }: CategoryPieChartProps) {
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    EVENT_CATEGORIES.forEach((cat) => {
      counts[cat] = 0;
    });

    allVisits.forEach(([_, __, visits]) => {
      visits.forEach((visit) => {
        const { categories } = parseCategories(visit.comment);
        if (categories.length === 0) {
          counts['Other']++;
        } else {
          categories.forEach((cat) => {
            counts[cat]++;
          });
        }
      });
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [allVisits]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Events by Category</CardTitle>
          <CardDescription>No event data available</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          No events to display
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events by Category</CardTitle>
        <CardDescription>Distribution of events across categories</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
