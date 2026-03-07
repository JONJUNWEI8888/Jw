import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { TrendingUp, TrendingDown, Clock, Users, DollarSign, Info } from 'lucide-react';
import { MarketData } from './MarketCard';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import { bettingApi } from '../lib/api';
import { auth } from '../lib/supabase';

interface MarketDialogProps {
  market: MarketData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBetPlaced?: () => void;
}

export function MarketDialog({ market, open, onOpenChange, onBetPlaced }: MarketDialogProps) {
  const [betAmount, setBetAmount] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes');
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  const yesPercentage = Math.round(market.yesPrice * 100);
  const noPercentage = Math.round(market.noPrice * 100);

  const handlePlaceBet = async () => {
    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error('请输入��效的投注金额');
      return;
    }

    // Check if user is authenticated
    if (!auth.isAuthenticated()) {
      toast.error('请先登录后再进行投注');
      return;
    }

    const amount = parseFloat(betAmount);
    setIsPlacingBet(true);

    try {
      const result = await bettingApi.placeBet(market.id, selectedOutcome, amount);
      
      const price = selectedOutcome === 'yes' ? market.yesPrice : market.noPrice;
      const shares = amount / price;
      const potentialReturn = shares * 1; // Each share is worth $1 if prediction is correct

      toast.success(result.message || `投注成功！您购买了 ${shares.toFixed(2)} 股 "${selectedOutcome === 'yes' ? '是' : '否'}" 的份额。`);

      setBetAmount('');
      onOpenChange(false);
      onBetPlaced?.();
    } catch (error: any) {
      console.error('Place bet error:', error);
      toast.error(error.message || '投注失败，请稍后重试');
    } finally {
      setIsPlacingBet(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
            <ImageWithFallback
              src={market.image}
              alt={market.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <Badge variant="secondary" className="mb-2">
                {market.category}
              </Badge>
              <DialogTitle className="text-white text-2xl">{market.title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base">
            {market.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Market Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">交易量</p>
                    <p className="font-semibold">{market.volume}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">参与者</p>
                    <p className="font-semibold">{market.participants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">截止时间</p>
                    <p className="font-semibold text-xs">{market.endDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  {market.trending === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : market.trending === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Info className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">趋势</p>
                    <p className="font-semibold">
                      {market.trending === 'up' ? '上涨' : market.trending === 'down' ? '下跌' : '平稳'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Interface */}
          <Tabs defaultValue="trade" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="trade">交易</TabsTrigger>
              <TabsTrigger value="info">市场信息</TabsTrigger>
            </TabsList>

            <TabsContent value="trade" className="space-y-4">
              {/* Outcome Selection */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={selectedOutcome === 'yes' ? 'default' : 'outline'}
                  className="h-auto flex flex-col items-center p-4"
                  onClick={() => setSelectedOutcome('yes')}
                >
                  <span className="text-sm mb-1">是</span>
                  <span className="text-2xl font-bold text-green-600">
                    {yesPercentage}¢
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    每股 ${market.yesPrice.toFixed(2)}
                  </span>
                </Button>

                <Button
                  variant={selectedOutcome === 'no' ? 'default' : 'outline'}
                  className="h-auto flex flex-col items-center p-4"
                  onClick={() => setSelectedOutcome('no')}
                >
                  <span className="text-sm mb-1">否</span>
                  <span className="text-2xl font-bold text-red-600">
                    {noPercentage}¢
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    每股 ${market.noPrice.toFixed(2)}
                  </span>
                </Button>
              </div>

              {/* Bet Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">投注金额 (美元)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="输入金额"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="pl-10"
                    min="0"
                    step="0.01"
                  />
                </div>

                {betAmount && parseFloat(betAmount) > 0 && (
                  <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">购买价格:</span>
                      <span className="font-medium">
                        ${(selectedOutcome === 'yes' ? market.yesPrice : market.noPrice).toFixed(2)} / 股
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">可购买股数:</span>
                      <span className="font-medium">
                        {(parseFloat(betAmount) / (selectedOutcome === 'yes' ? market.yesPrice : market.noPrice)).toFixed(2)} 股
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">潜在收益:</span>
                      <span className="font-medium text-green-600">
                        ${(parseFloat(betAmount) / (selectedOutcome === 'yes' ? market.yesPrice : market.noPrice) - parseFloat(betAmount)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount(amount.toString())}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>

              {/* Place Bet Button */}
              <Button className="w-full" size="lg" onClick={handlePlaceBet} disabled={isPlacingBet}>
                {isPlacingBet ? '投注中...' : '确认投注'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                投注前请确保您已充分了解市场规则和风险
              </p>
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">市场规则</h4>
                  <p className="text-sm text-muted-foreground">
                    此市场基于真实世界事件的结果进行结算。如果事件发生，"是"方获胜；如果事件未发生，"否"方获胜。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">结算条件</h4>
                  <p className="text-sm text-muted-foreground">
                    市场将在截止日期后根据权威来源的信息进行结算。获胜方的每股将价值1美元。
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">当前赔率</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span className="font-medium">是</span>
                      <span className="text-lg font-bold text-green-600">{yesPercentage}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span className="font-medium">否</span>
                      <span className="text-lg font-bold text-red-600">{noPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">注意事项</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>投注金额不可退回</li>
                    <li>请根据自身风险承受能力理性投注</li>
                    <li>市场价格会根据交易实时变动</li>
                    <li>结算可能需要时间以确保准确性</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}