import { MarketCard, MarketData } from './MarketCard';

interface MarketGridProps {
  markets: MarketData[];
}

export function MarketGrid({ markets }: MarketGridProps) {
  if (markets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">没有找到符合条件的市场</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}