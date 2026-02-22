import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Party, PartyVisitRecord } from '../../backend';

interface PartyEngagementChartProps {
  parties: Array<[string, Party]>;
  allVisits: Array<[string, any, PartyVisitRecord[]]>;
}

export default function PartyEngagementChart({ parties, allVisits }: PartyEngagementChartProps) {
  const engagementData = useMemo(() => {
    const partyVisitCounts = new Map<string, number>();

    allVisits.forEach(([partyId, _, visits]) => {
      partyVisitCounts.set(partyId, visits.length);
    });

    const data = parties
      .map(([partyId, party]) => ({
        name: party.name.length > 20 ? party.name.substring(0, 20) + '...' : party.name,
        visits: partyVisitCounts.get(partyId) || 0,
      }))
      .filter((item) => item.visits > 0)
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    return data;
  }, [parties, allVisits]);

  if (engagementData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Party Engagement</CardTitle>
          <CardDescription>No visit data available</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          No visits to display
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Party Engagement</CardTitle>
        <CardDescription>Top 10 parties by visit count</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={engagementData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="visits" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
