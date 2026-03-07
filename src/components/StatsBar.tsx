import { Card, CardContent } from './ui/card';
import { TrendingUp, DollarSign, Users, Activity } from 'lucide-react';

export function StatsBar() {
  const stats = [
    {
      icon: DollarSign,
      label: '总交易量',
      value: '$2.5B',
      change: '+12.5%',
      changeType: 'positive' as const,
    },
    {
      icon: Users,
      label: '活跃用户',
      value: '245K',
      change: '+8.2%',
      changeType: 'positive' as const,
    },
    {
      icon: Activity,
      label: '活跃市场',
      value: '1,432',
      change: '+15.3%',
      changeType: 'positive' as const,
    },
    {
      icon: TrendingUp,
      label: '24小时交易',
      value: '$12.8M',
      change: '+5.7%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{stat.value}</span>
                  <span className={`text-xs ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}