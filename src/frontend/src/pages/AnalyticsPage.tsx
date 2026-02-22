import { useMemo, useState } from 'react';
import { useGetAllParties } from '../hooks/queries/useParties';
import { useActorSession } from '../context/ActorSessionContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Download } from 'lucide-react';
import { formatMoney } from '../lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import MetricsSummaryCards from '../components/analytics/MetricsSummaryCards';
import CategoryPieChart from '../components/analytics/CategoryPieChart';
import PartyEngagementChart from '../components/analytics/PartyEngagementChart';
import type { PartyVisitRecord } from '../backend';

export default function AnalyticsPage() {
  const { data: parties = [], isLoading: partiesLoading } = useGetAllParties();
  const { actor, isLoading: actorLoading } = useActorSession();

  const { data: allVisits = [], isLoading: visitsLoading } = useQuery<Array<[string, any, PartyVisitRecord[]]>>({
    queryKey: ['allPartiesWithVisits'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPartiesWithVisitRecords();
    },
    enabled: !!actor && !actorLoading,
  });

  const analytics = useMemo(() => {
    const totalParties = parties.length;
    const totalEvents = allVisits.reduce((sum, [_, __, visits]) => sum + visits.length, 0);
    
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
    
    let upcomingCount = 0;
    let totalDue = BigInt(0);

    allVisits.forEach(([_, __, visits]) => {
      visits.forEach((visit) => {
        if (visit.nextPaymentDate) {
          const nextTime = Number(visit.nextPaymentDate) / 1000000;
          if (nextTime >= now && nextTime <= sevenDaysFromNow) {
            upcomingCount++;
          }
        }
      });
    });

    parties.forEach(([_, party]) => {
      totalDue += party.dueAmount;
    });

    return {
      totalParties,
      totalEvents,
      upcomingCount,
      totalDue,
    };
  }, [parties, allVisits]);

  const isLoading = partiesLoading || visitsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Comprehensive insights and metrics</p>
        </div>
      </div>

      <MetricsSummaryCards
        totalParties={analytics.totalParties}
        totalEvents={analytics.totalEvents}
        upcomingCount={analytics.upcomingCount}
        totalDue={analytics.totalDue}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryPieChart allVisits={allVisits} />
        <PartyEngagementChart parties={parties} allVisits={allVisits} />
      </div>
    </div>
  );
}
