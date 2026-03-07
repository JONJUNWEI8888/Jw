import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

const categories = [
  { id: 'all', label: '全部', icon: '🔥' },
  { id: 'politics', label: '政治', icon: '🗳️' },
  { id: 'sports', label: '体育', icon: '⚽' },
  { id: 'crypto', label: '加密货币', icon: '₿' },
  { id: 'tech', label: '科技', icon: '💻' },
  { id: 'entertainment', label: '娱乐', icon: '🎬' },
];

interface CategoryTabsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryTabs({ selectedCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="w-full overflow-x-auto">
      <Tabs value={selectedCategory} onValueChange={onCategoryChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-12">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center space-x-2"
            >
              <span>{category.icon}</span>
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}