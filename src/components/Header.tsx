import { Search, Menu, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { WalletDialog } from './WalletDialog';
import { auth } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onAuthChange?: () => void;
}

export function Header({ 
  searchQuery, 
  onSearchChange, 
  isAuthenticated = false,
  onLoginClick,
  onAuthChange
}: HeaderProps) {
  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success('已退出登录');
      onAuthChange?.();
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('退出登录失败');
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 bg-clip-text text-transparent">88888888.win</h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索市场..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <WalletDialog />
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  退出
                </Button>
              </>
            ) : (
              <Button variant="default" size="sm" onClick={onLoginClick}>
                登录 / 注册
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}