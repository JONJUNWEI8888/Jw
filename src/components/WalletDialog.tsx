import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, TrendingUp, Copy, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import QRCode from 'qrcode';
import { walletApi, userApi } from '../lib/api';
import { auth } from '../lib/supabase';

export function WalletDialog() {
  const [depositAmount, setDepositAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'fiat' | 'crypto'>('fiat');
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // USDT 收款地址（示例地址，实际使用时应该是用户真实的钱包地址）
  const usdtAddress = 'TYDzsYUEpvnYmQk4zGP9JgUvKXjh4Nj8nM';

  // Load wallet data when dialog opens
  useEffect(() => {
    if (isOpen && auth.isAuthenticated()) {
      loadWalletData();
    }
  }, [isOpen]);

  // 生成二维码
  useEffect(() => {
    if (paymentMethod === 'crypto' && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, usdtAddress, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    }
  }, [paymentMethod, usdtAddress]);

  const loadWalletData = async () => {
    try {
      // Load balance
      const walletData = await walletApi.getBalance();
      setBalance(walletData.wallet?.balance || 0);

      // Load transactions
      const txData = await walletApi.getTransactions();
      setTransactions(txData.transactions || []);

      // Load positions
      const posData = await userApi.getPositions();
      setPositions(posData.positions || []);
    } catch (error: any) {
      console.error('Failed to load wallet data:', error);
      if (error.message.includes('Unauthorized')) {
        toast.error('请先登录后再查看钱包');
      } else {
        toast.error('加载钱包数据失败');
      }
    }
  };

  // 复制地址到剪贴板
  const copyAddress = () => {
    navigator.clipboard.writeText(usdtAddress);
    setCopied(true);
    toast.success('地址已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('请输入有效的充值金额');
      return;
    }

    if (!auth.isAuthenticated()) {
      toast.error('请先登录后再进行充值');
      return;
    }

    setIsLoading(true);
    try {
      const amount = parseFloat(depositAmount);
      const result = await walletApi.deposit(amount);
      
      toast.success(result.message || `成功充值 ${amount} USDT`);
      setBalance(result.newBalance);
      setDepositAmount('');
      
      // Reload wallet data to update transactions
      await loadWalletData();
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || '充值失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wallet className="h-4 w-4 mr-2" />
          钱包
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>我的钱包</DialogTitle>
          <DialogDescription>管理您的资金和查看交易历史</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">可用余额</span>
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold mb-4">
                ${balance.toFixed(2)}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">总投资</p>
                  <p className="font-semibold">$76.25</p>
                </div>
                <div>
                  <p className="text-muted-foreground">当前价值</p>
                  <p className="font-semibold">$78.00</p>
                </div>
                <div>
                  <p className="text-muted-foreground">总盈亏</p>
                  <p className="font-semibold text-green-600">+$1.75</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="deposit">充值</TabsTrigger>
              <TabsTrigger value="positions">持仓</TabsTrigger>
              <TabsTrigger value="history">历史</TabsTrigger>
            </TabsList>

            <TabsContent value="deposit" className="space-y-4">
              {/* Payment Method Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">充值方式</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === 'fiat' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('fiat')}
                  >
                    信用卡/借记卡
                  </Button>
                  <Button
                    variant={paymentMethod === 'crypto' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('crypto')}
                  >
                    USDT 加密货币
                  </Button>
                </div>
              </div>

              {paymentMethod === 'fiat' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">充值金额 (美元)</label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="输入金额"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      <Button onClick={handleDeposit}>
                        <Plus className="h-4 w-4 mr-2" />
                        充值
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 250, 500].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount(amount.toString())}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm">充值说明</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• 支持信用卡、借记卡和加密货币充值</li>
                      <li>• 充值立即到账，无手续费</li>
                      <li>• 最低充值金额为 $10</li>
                      <li>• 资金受平台安全保障</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border">
                      <h4 className="font-semibold mb-3 text-sm">USDT (TRC-20) 收款地址</h4>
                      <canvas
                        ref={qrCanvasRef}
                        className="mb-4 rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground text-center mb-2">
                        扫描二维码或复制地址进行转账
                      </p>
                    </div>

                    {/* Address Display */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">钱包地址</label>
                      <div className="flex space-x-2">
                        <Input
                          value={usdtAddress}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyAddress}
                          className="shrink-0"
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">预计充值金额 (USDT)</label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          placeholder="输入 USDT 数量"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                        <Button onClick={handleDeposit}>
                          确认
                        </Button>
                      </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[50, 100, 250, 500].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setDepositAmount(amount.toString())}
                        >
                          {amount} USDT
                        </Button>
                      ))}
                    </div>

                    {/* Crypto Deposit Instructions */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm text-amber-900 dark:text-amber-100">
                        ⚠️ 重要提示
                      </h4>
                      <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                        <li>• 仅支持 USDT (TRC-20) 网络转账</li>
                        <li>• 请勿向此地址转入其他类型的加密货币</li>
                        <li>• 最低充值金额为 10 USDT</li>
                        <li>• 到账时间通常为 1-3 个网络确认（约 3-10 分钟）</li>
                        <li>• 转账完成后请保存交易哈希（TXID）</li>
                        <li>• 如有问题请联系客服并提供 TXID</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="positions" className="space-y-3">
              {positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无持仓
                </div>
              ) : (
                positions.map((position) => {
                  const pnl = position.value - position.invested;
                  const pnlPercent = ((pnl / position.invested) * 100).toFixed(2);

                  return (
                    <Card key={position.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm line-clamp-2">
                                {position.market}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                预测: {position.outcome} • {position.shares} 股
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold">${position.value.toFixed(2)}</p>
                              <p
                                className={`text-xs ${
                                  pnl >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPercent}%)
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">平均价</p>
                              <p className="font-medium">${position.avgPrice.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">当前价</p>
                              <p className="font-medium">${position.currentPrice.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">投入</p>
                              <p className="font-medium">${position.invested.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-2">
              {transactions.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-full ${
                            tx.type === 'deposit'
                              ? 'bg-blue-100 dark:bg-blue-900'
                              : tx.type === 'win'
                              ? 'bg-green-100 dark:bg-green-900'
                              : 'bg-orange-100 dark:bg-orange-900'
                          }`}
                        >
                          {tx.type === 'deposit' ? (
                            <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                          ) : tx.type === 'win' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-orange-600" />
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-sm">
                            {tx.type === 'deposit'
                              ? '充值'
                              : tx.type === 'win'
                              ? '盈利'
                              : '投注'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.market || '账户充值'} {tx.outcome && `• ${tx.outcome}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>

                      <div
                        className={`font-semibold ${
                          tx.amount >= 0 ? 'text-green-600' : 'text-foreground'
                        }`}
                      >
                        {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}