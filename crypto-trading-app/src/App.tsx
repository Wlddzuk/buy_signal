import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Settings, 
  Smartphone, 
  Activity,
  DollarSign,
  AlertTriangle,
  Target,
  Clock,
  Bell
} from "lucide-react";

interface MarketData {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
}

const mockMarketData: MarketData[] = [
  { symbol: "BTCUSDT", price: "43,250.00", change: "+1,250.00", changePercent: "+2.98", volume: "2.5B" },
  { symbol: "ETHUSDT", price: "2,680.50", change: "+85.30", changePercent: "+3.28", volume: "1.8B" },
  { symbol: "SOLUSDT", price: "102.45", change: "-2.15", changePercent: "-2.06", volume: "850M" },
];

export default function TradingApp() {
  const [selectedExchange, setSelectedExchange] = useState("binance");
  const [selectedType, setSelectedType] = useState("spot");
  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("4h");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoTrading, setAutoTrading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm dark:bg-slate-900/95">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-2">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">CryptoSignals</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pro Trading Signals</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        {/* Exchange and Type Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Exchange & Trading Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Exchange</Label>
                <Select value={selectedExchange} onValueChange={setSelectedExchange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="bybit">Bybit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trading Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spot">Spot Trading</SelectItem>
                    <SelectItem value="futures">Futures Trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Market Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {mockMarketData.map((coin) => (
                <div 
                  key={coin.symbol}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  onClick={() => setSelectedPair(coin.symbol)}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{coin.symbol}</span>
                    <span className="text-sm text-slate-500">${coin.price}</span>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 ${coin.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {coin.change.startsWith('+') ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span className="font-medium">{coin.changePercent}%</span>
                    </div>
                    <span className="text-xs text-slate-500">Vol: {coin.volume}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trading Pair and Timeframe */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Selected Pair: <Badge variant="secondary">{selectedPair}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeframe
                </Label>
                <Tabs value={selectedTimeframe} onValueChange={setSelectedTimeframe} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="1h">1H</TabsTrigger>
                    <TabsTrigger value="4h">4H</TabsTrigger>
                    <TabsTrigger value="1d">1D</TabsTrigger>
                    <TabsTrigger value="1w">1W</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Placeholder */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Price Chart & Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-96 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-2">
                <BarChart3 className="h-12 w-12 mx-auto text-slate-400" />
                <p className="text-slate-500">Advanced TradingView Chart</p>
                <p className="text-sm text-slate-400">EMA Lines, VWAP, MACD & Supply/Demand Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Strategies */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EMA Bounce Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                EMA Bounce Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">EMA 9 (Fast)</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">EMA 20 (Medium)</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">EMA 200 (Slow)</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">VWAP Filter</span>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">MACD Filter</span>
                  <Badge variant="outline">Active</Badge>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Signal</span>
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    Waiting for Setup
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supply & Demand Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-purple-600" />
                Supply & Demand Zones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Demand Zones (R-B-R)</span>
                  <Badge variant="outline">2 Found</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Supply Zones (D-B-D)</span>
                  <Badge variant="outline">1 Found</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reversal Zones (D-B-R)</span>
                  <Badge variant="outline">3 Found</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Chain Strategy</span>
                  <Badge variant="outline">Monitoring</Badge>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Zone Status</span>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    Price in Demand Zone
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Signal Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Signal Alerts
                </Label>
                <p className="text-sm text-slate-500">Get notified when buy signals are detected</p>
              </div>
              <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile Notifications
                </Label>
                <p className="text-sm text-slate-500">Push notifications to your device</p>
              </div>
              <Switch checked={autoTrading} onCheckedChange={setAutoTrading} />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
