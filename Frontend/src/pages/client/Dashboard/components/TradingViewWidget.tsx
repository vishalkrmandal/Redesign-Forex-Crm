import { ArrowUpRight, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

interface TradingViewWidgetProps {
    theme?: 'light' | 'dark';
}

// Frontend/src/pages/client/Dashboard/components/TradingViewWidget.tsx
const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ theme = 'light' }) => {
    const [selectedSymbol, setSelectedSymbol] = useState('FX:EURUSD');

    const symbols = [
        { label: 'EUR/USD', value: 'FX:EURUSD' },
        { label: 'GBP/USD', value: 'FX:GBPUSD' },
        { label: 'USD/JPY', value: 'FX:USDJPY' },
        { label: 'BTC/USD', value: 'COINBASE:BTCUSD' },
        { label: 'ETH/USD', value: 'COINBASE:ETHUSD' },
        { label: 'Gold', value: 'TVC:GOLD' },
        { label: 'Silver', value: 'TVC:SILVER' },
        { label: 'Oil', value: 'TVC:USOIL' }
    ];

    useEffect(() => {
        // Clean up any existing widget
        const container = document.getElementById('tradingview_widget');
        if (container) {
            container.innerHTML = '';
        }

        // Create and configure the script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": selectedSymbol,
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": theme,
            "style": "1",
            "locale": "en",
            "toolbar_bg": theme === 'dark' ? "#1A1C1E" : "#FCFCFC",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "calendar": false,
            "support_host": "https://www.tradingview.com"
        });

        if (container) {
            container.appendChild(script);
        }

        // Cleanup function to remove script when component unmounts or dependencies change
        return () => {
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [selectedSymbol, theme]);

    return (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-1 md:p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 md:gap-4 px-2 py-1">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Live Market Data</h3>
                        <p className="text-sm text-muted-foreground">Real-time trading charts</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        value={selectedSymbol}
                        onChange={(e) => setSelectedSymbol(e.target.value)}
                        className="px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                        {symbols.map(symbol => (
                            <option key={symbol.value} value={symbol.value}>{symbol.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=${selectedSymbol}`, '_blank')}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Open in TradingView"
                    >
                        <ArrowUpRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <div className="h-96 rounded-lg overflow-hidden border border-border">
                <div id="tradingview_widget" className="h-full w-full"></div>
            </div>
        </div>
    );
};

TradingViewWidget.displayName = 'TradingViewWidget';

export default TradingViewWidget;