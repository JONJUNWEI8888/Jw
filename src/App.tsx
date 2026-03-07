import { useState, useMemo, useEffect } from "react";
import { Header } from "./components/Header";
import { CategoryTabs } from "./components/CategoryTabs";
import { StatsBar } from "./components/StatsBar";
import { MarketGrid } from "./components/MarketGrid";
import { AuthDialog } from "./components/AuthDialog";
import { Toaster } from "./components/ui/sonner";
import { marketApi } from "./lib/api";
import { auth } from "./lib/supabase";
import { toast } from "sonner@2.0.3";

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [markets, setMarkets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load markets on mount and when category/search changes
  useEffect(() => {
    loadMarkets();
  }, [selectedCategory, searchQuery]);

  const checkAuth = async () => {
    try {
      const session = await auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  const loadMarkets = async () => {
    setIsLoading(true);
    try {
      const categoryMap: { [key: string]: string } = {
        all: '',
        politics: "政治",
        sports: "体育",
        crypto: "加密货币",
        tech: "科技",
        entertainment: "娱乐",
      };

      const category = categoryMap[selectedCategory];
      const { markets: fetchedMarkets } = await marketApi.getMarkets(
        category || undefined,
        searchQuery || undefined
      );
      
      setMarkets(fetchedMarkets || []);
    } catch (error: any) {
      console.error('Failed to load markets:', error);
      toast.error('加载市场数据失败：' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    loadMarkets(); // Refresh markets after login
  };

  const filteredMarkets = useMemo(() => {
    return markets;
  }, [markets]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setShowAuthDialog(true)}
        onAuthChange={() => {
          setIsAuthenticated(false);
          loadMarkets();
        }}
      />

      <main className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            预测未来，赢取收益
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            在全球最大的预测市场上交易真实世界事件的结果
          </p>
        </div>

        {/* Stats */}
        <StatsBar />

        {/* Category Navigation */}
        <div className="mb-6">
          <CategoryTabs
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Markets Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              {selectedCategory === "all"
                ? "热门市场"
                : "筛选结果"}
            </h2>
            <div className="text-sm text-muted-foreground">
              共 {filteredMarkets.length} 个市场
            </div>
          </div>

          <MarketGrid markets={filteredMarkets} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4 bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 bg-clip-text text-transparent">
                88888888.win
              </h3>
              <p className="text-sm text-muted-foreground">
                全球领先的预测市场平台，让您能够对真实世界事件进行预测和交易。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">市场</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>政治</li>
                <li>体育</li>
                <li>加密货币</li>
                <li>科技</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">资源</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>使用指南</li>
                <li>API文档</li>
                <li>白皮书</li>
                <li>博客</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">支持</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>帮助中心</li>
                <li>社区</li>
                <li>联系我们</li>
                <li>法律条款</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 88888888.win. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}