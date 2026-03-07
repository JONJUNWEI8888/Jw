import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Middleware to verify user authentication
const requireAuth = async (c: any, next: any) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    console.log('Auth error:', error);
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }

  c.set('userId', user.id);
  c.set('user', user);
  await next();
};

// Health check endpoint
app.get("/make-server-3f0c09a6/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================
// AUTH ROUTES
// ============================================

// User signup
app.post("/make-server-3f0c09a6/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: `Signup failed: ${error.message}` }, 400);
    }

    // Initialize user wallet with 1000 USDT
    await kv.set(`wallet:${data.user.id}`, {
      userId: data.user.id,
      balance: 1000,
      currency: 'USDT',
      createdAt: new Date().toISOString(),
    });

    // Initialize empty positions
    await kv.set(`positions:${data.user.id}`, []);

    // Initialize empty transaction history
    await kv.set(`transactions:${data.user.id}`, []);

    return c.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name,
      },
      message: 'Account created successfully! You have been credited with 1000 USDT.',
    });
  } catch (error: any) {
    console.log('Signup error:', error);
    return c.json({ error: `Signup failed: ${error.message}` }, 500);
  }
});

// User login (handled by Supabase client on frontend)
// This endpoint is just for documentation
app.post("/make-server-3f0c09a6/auth/login", async (c) => {
  return c.json({
    message: 'Login should be handled by Supabase client on the frontend using signInWithPassword',
  });
});

// Get current user info
app.get("/make-server-3f0c09a6/auth/me", requireAuth, async (c) => {
  const user = c.get('user');
  const userId = c.get('userId');

  const wallet = await kv.get(`wallet:${userId}`);

  return c.json({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name,
    wallet: wallet || { balance: 0, currency: 'USDT' },
  });
});

// ============================================
// MARKET ROUTES
// ============================================

// Get all markets
app.get("/make-server-3f0c09a6/markets", async (c) => {
  try {
    const category = c.req.query('category');
    const search = c.req.query('search');

    let markets = await kv.getByPrefix('market:');
    
    if (!markets || markets.length === 0) {
      // Initialize with mock data if empty
      await initializeMockMarkets();
      markets = await kv.getByPrefix('market:');
    }

    let filteredMarkets = markets;

    // Filter by category
    if (category && category !== '全部') {
      filteredMarkets = filteredMarkets.filter((m: any) => m.category === category);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMarkets = filteredMarkets.filter((m: any) =>
        m.title.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower)
      );
    }

    return c.json({ markets: filteredMarkets });
  } catch (error: any) {
    console.log('Get markets error:', error);
    return c.json({ error: `Failed to get markets: ${error.message}` }, 500);
  }
});

// Get market by ID
app.get("/make-server-3f0c09a6/markets/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const market = await kv.get(`market:${id}`);

    if (!market) {
      return c.json({ error: 'Market not found' }, 404);
    }

    return c.json({ market });
  } catch (error: any) {
    console.log('Get market error:', error);
    return c.json({ error: `Failed to get market: ${error.message}` }, 500);
  }
});

// ============================================
// BETTING ROUTES
// ============================================

// Place a bet
app.post("/make-server-3f0c09a6/bets/place", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { marketId, outcome, amount } = body;

    if (!marketId || !outcome || !amount || amount <= 0) {
      return c.json({ error: 'Invalid bet parameters' }, 400);
    }

    // Get user wallet
    const wallet = await kv.get(`wallet:${userId}`);
    if (!wallet || wallet.balance < amount) {
      return c.json({ error: 'Insufficient balance' }, 400);
    }

    // Get market
    const market = await kv.get(`market:${marketId}`);
    if (!market) {
      return c.json({ error: 'Market not found' }, 404);
    }

    const price = outcome === 'yes' ? market.yesPrice : market.noPrice;
    const shares = amount / price;

    // Deduct from wallet
    wallet.balance -= amount;
    await kv.set(`wallet:${userId}`, wallet);

    // Create bet record
    const betId = `bet:${userId}:${Date.now()}`;
    const bet = {
      id: betId,
      userId,
      marketId,
      outcome,
      amount,
      shares,
      price,
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    await kv.set(betId, bet);

    // Update user positions
    const positions = (await kv.get(`positions:${userId}`)) || [];
    const existingPosition = positions.find((p: any) => 
      p.marketId === marketId && p.outcome === outcome
    );

    if (existingPosition) {
      existingPosition.shares += shares;
      existingPosition.totalInvested += amount;
      existingPosition.avgPrice = existingPosition.totalInvested / existingPosition.shares;
    } else {
      positions.push({
        marketId,
        marketTitle: market.title,
        outcome,
        shares,
        totalInvested: amount,
        avgPrice: price,
        currentPrice: price,
      });
    }
    await kv.set(`positions:${userId}`, positions);

    // Add to transaction history
    const transactions = (await kv.get(`transactions:${userId}`)) || [];
    transactions.unshift({
      id: betId,
      type: 'bet',
      marketTitle: market.title,
      outcome,
      amount: -amount,
      shares,
      price,
      timestamp: new Date().toISOString(),
    });
    await kv.set(`transactions:${userId}`, transactions);

    // Update market volume
    const volumeNum = parseFloat(market.volume.replace(/[$MK]/g, ''));
    const volumeUnit = market.volume.includes('M') ? 'M' : 'K';
    const newVolume = volumeNum + (amount / (volumeUnit === 'M' ? 1000000 : 1000));
    market.volume = `$${newVolume.toFixed(1)}${volumeUnit}`;
    market.participants += 1;
    await kv.set(`market:${marketId}`, market);

    return c.json({
      success: true,
      bet,
      newBalance: wallet.balance,
      message: `Successfully placed ${amount} USDT bet on ${outcome.toUpperCase()}`,
    });
  } catch (error: any) {
    console.log('Place bet error:', error);
    return c.json({ error: `Failed to place bet: ${error.message}` }, 500);
  }
});

// Get user's betting history
app.get("/make-server-3f0c09a6/bets/history", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const bets = await kv.getByPrefix(`bet:${userId}:`);

    return c.json({ bets: bets || [] });
  } catch (error: any) {
    console.log('Get bet history error:', error);
    return c.json({ error: `Failed to get bet history: ${error.message}` }, 500);
  }
});

// ============================================
// WALLET ROUTES
// ============================================

// Get wallet balance
app.get("/make-server-3f0c09a6/wallet/balance", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const wallet = await kv.get(`wallet:${userId}`);

    if (!wallet) {
      return c.json({ error: 'Wallet not found' }, 404);
    }

    return c.json({ wallet });
  } catch (error: any) {
    console.log('Get wallet error:', error);
    return c.json({ error: `Failed to get wallet: ${error.message}` }, 500);
  }
});

// Deposit to wallet
app.post("/make-server-3f0c09a6/wallet/deposit", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return c.json({ error: 'Invalid deposit amount' }, 400);
    }

    const wallet = await kv.get(`wallet:${userId}`);
    if (!wallet) {
      return c.json({ error: 'Wallet not found' }, 404);
    }

    wallet.balance += amount;
    await kv.set(`wallet:${userId}`, wallet);

    // Add to transaction history
    const transactions = (await kv.get(`transactions:${userId}`)) || [];
    transactions.unshift({
      id: `deposit:${Date.now()}`,
      type: 'deposit',
      amount: amount,
      timestamp: new Date().toISOString(),
    });
    await kv.set(`transactions:${userId}`, transactions);

    return c.json({
      success: true,
      newBalance: wallet.balance,
      message: `Successfully deposited ${amount} USDT`,
    });
  } catch (error: any) {
    console.log('Deposit error:', error);
    return c.json({ error: `Failed to deposit: ${error.message}` }, 500);
  }
});

// Get transaction history
app.get("/make-server-3f0c09a6/wallet/transactions", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const transactions = await kv.get(`transactions:${userId}`);

    return c.json({ transactions: transactions || [] });
  } catch (error: any) {
    console.log('Get transactions error:', error);
    return c.json({ error: `Failed to get transactions: ${error.message}` }, 500);
  }
});

// ============================================
// USER POSITIONS
// ============================================

// Get user positions
app.get("/make-server-3f0c09a6/user/positions", requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const positions = await kv.get(`positions:${userId}`);

    return c.json({ positions: positions || [] });
  } catch (error: any) {
    console.log('Get positions error:', error);
    return c.json({ error: `Failed to get positions: ${error.message}` }, 500);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function initializeMockMarkets() {
  const mockMarkets = [
    {
      id: '1',
      title: '2024年美国总统大选：民主党候选人获胜？',
      description: '2024年美国总统大选中，民主党候选人是否会战胜共和党候选人获得总统职位？',
      category: '政治',
      yesPrice: 0.52,
      noPrice: 0.48,
      volume: '$2.3M',
      endDate: '2024年11月5日',
      participants: 12547,
      image: 'https://images.unsplash.com/photo-1560981477-dbcccffc1565?w=400',
      trending: 'up',
    },
    {
      id: '2',
      title: '曼城vs阿森纳：曼城获胜？',
      description: '英超联赛中曼城队是否会在对阵阿森纳的比赛中获胜？',
      category: '体育',
      yesPrice: 0.65,
      noPrice: 0.35,
      volume: '$890K',
      endDate: '2024年3月31日',
      participants: 8934,
      image: 'https://images.unsplash.com/photo-1549923015-badf41b04831?w=400',
      trending: 'neutral',
    },
    {
      id: '3',
      title: '比特币价格在2024年底前超过10万美元？',
      description: '比特币的价格是否会在2024年12月31日前达到或超过100,000美元？',
      category: '加密货币',
      yesPrice: 0.73,
      noPrice: 0.27,
      volume: '$1.5M',
      endDate: '2024年12月31日',
      participants: 15623,
      image: 'https://images.unsplash.com/photo-1633534415766-165181ffdbb7?w=400',
      trending: 'up',
    },
    {
      id: '4',
      title: 'Apple发布AR眼镜？',
      description: 'Apple是否会在2024年正式发布消费级AR眼镜产品？',
      category: '科技',
      yesPrice: 0.38,
      noPrice: 0.62,
      volume: '$420K',
      endDate: '2024年12月31日',
      participants: 5431,
      image: 'https://images.unsplash.com/photo-1758598497889-05bf628874a7?w=400',
      trending: 'down',
    },
    {
      id: '5',
      title: '《复仇者联盟5》票房超过20亿美元？',
      description: '漫威电影《复仇者联盟5》的全球票房是否会超过20亿美元？',
      category: '娱乐',
      yesPrice: 0.45,
      noPrice: 0.55,
      volume: '$680K',
      endDate: '2025年6月30日',
      participants: 7892,
      image: 'https://images.unsplash.com/photo-1739433437912-cca661ba902f?w=400',
      trending: 'neutral',
    },
    {
      id: '6',
      title: '中国队进入世界杯八强？',
      description: '中国男足国家队是否会在2026年世界杯中进入八强？',
      category: '体育',
      yesPrice: 0.15,
      noPrice: 0.85,
      volume: '$320K',
      endDate: '2026年7月15日',
      participants: 4567,
      image: 'https://images.unsplash.com/photo-1705593973313-75de7bf95b56?w=400',
      trending: 'down',
    },
    {
      id: '7',
      title: '以太坊价格超过5000美元？',
      description: '以太坊(ETH)的价格是否会在2024年内达到或超过5000美元？',
      category: '加密货币',
      yesPrice: 0.58,
      noPrice: 0.42,
      volume: '$950K',
      endDate: '2024年12月31日',
      participants: 9876,
      image: 'https://images.unsplash.com/photo-1660836709415-fdf7d56a6e73?w=400',
      trending: 'up',
    },
    {
      id: '8',
      title: 'OpenAI发布GPT-5？',
      description: 'OpenAI是否会在2024年正式发布GPT-5模型？',
      category: '科技',
      yesPrice: 0.67,
      noPrice: 0.33,
      volume: '$1.2M',
      endDate: '2024年12月31日',
      participants: 11234,
      image: 'https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?w=400',
      trending: 'up',
    },
  ];

  for (const market of mockMarkets) {
    await kv.set(`market:${market.id}`, market);
  }
  
  console.log('Initialized mock markets in database');
}

Deno.serve(app.fetch);