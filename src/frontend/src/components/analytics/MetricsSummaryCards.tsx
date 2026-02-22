import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Bell, DollarSign } from 'lucide-react';
import { formatMoney } from '../../lib/format';

interface MetricsSummaryCardsProps {
  totalParties: number;
  totalEvents: number;
  upcomingCount: number;
  totalDue: bigint;
}

export default function MetricsSummaryCards({
  totalParties,
  totalEvents,
  upcomingCount,
  totalDue,
}: MetricsSummaryCardsProps) {
  const metrics = [
    {
      title: 'Total Parties',
      value: totalParties.toString(),
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Total Events',
      value: totalEvents.toString(),
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Upcoming (7 Days)',
      value: upcomingCount.toString(),
      icon: Bell,
      color: 'text-orange-600',
    },
    {
      title: 'Total Due Amount',
      value: formatMoney(totalDue),
      icon: DollarSign,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
