import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { TrendingUp, TrendingDown, Clock, Users } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MarketDialog } from './MarketDialog';

export interface MarketData {
  id: string;
  title: string;
  description: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  endDate: string;
  participants: number;
  image: string;
  trending: 'up' | 'down' | 'neutral';
}

interface MarketCardProps {
  market: MarketData;
}

export function MarketCard({ market }: MarketCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const yesPercentage = Math.round(market.yesPrice * 100);
  const noPercentage = Math.round(market.noPrice * 100);

  return (
    <>
      <Card 
        className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
      <CardHeader className="p-0">
        <div className="relative h-40 overflow-hidden rounded-t-lg">
          <ImageWithFallback
            src={market.image}
            alt={market.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur">
              {market.category}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            {market.trending === 'up' && (
              <TrendingUp className="h-5 w-5 text-green-500" />
            )}
            {market.trending === 'down' && (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2">{market.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {market.description}
        </p>

        {/* Odds */}
        <div className="flex space-x-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 flex flex-col items-center p-3 h-auto"
          >
            <span className="text-xs text-muted-foreground">是</span>
            <span className="font-semibold text-green-600">{yesPercentage}¢</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 flex flex-col items-center p-3 h-auto"
          >
            <span className="text-xs text-muted-foreground">否</span>
            <span className="font-semibold text-red-600">{noPercentage}¢</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{market.participants}人参与</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>交易量: {market.volume}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>截止时间: {market.endDate}</span>
          </div>
        </div>
      </CardFooter>
    </Card>

    <MarketDialog 
      market={market}
      open={dialogOpen}
      onOpenChange={setDialogOpen}
    />
    </>
  );
}