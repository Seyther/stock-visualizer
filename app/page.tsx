"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChartContainer } from "./components/ChartContainer";
import { CandleData } from "./lib/dataParams";
import * as Indicators from "./lib/indicators";
import { Search, Plus, X, Settings, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, List, Activity, Clock } from "lucide-react";

type IndicatorType = 'SMA' | 'EMA' | 'RSI' | 'TD9' | 'MACD';

interface IndicatorSeries {
    values: (number | undefined)[];
    color: string;
}

interface ActiveIndicator {
    id: string;
    type: IndicatorType;
    period: number;      // Fast Period / Short Cycle / RSI 1
    period2?: number;    // RSI 2
    period3?: number;    // RSI 3
    slowPeriod?: number;   // Long Term
    signalPeriod?: number; // Moving Average Cycle
    color: string;
}

const DEFAULT_COLORS = [
    '#2962ff', '#00bfa5', '#ff0000', '#ff6d00', '#6200ea',
    '#ffd600', '#9c27b0', '#4caf50', '#e040fb', '#ea80fc',
    '#00e5ff', '#ff1744', '#1de9b6', '#d500f9', '#ffea00',
    '#00c853', '#3d5afe', '#f50057', '#0091ea', '#ff3d00'
];

const generateRandomVividColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 80%, 60%)`;
};

export default function Home() {
    const [data, setData] = useState<CandleData[]>([]);
    const [meta, setMeta] = useState<{ fiftyTwoWeekHigh: number; fiftyTwoWeekLow: number; shortName?: string; longName?: string; symbol?: string } | null>(null);
    const [symbol, setSymbol] = useState("BTC-USD");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dynamic Indicators State
    const [activeIndicators, setActiveIndicators] = useState<ActiveIndicator[]>([
        { id: '1', type: 'SMA', period: 20, color: '#2962ff' },
        { id: '2', type: 'SMA', period: 200, color: '#00bfa5' },
        { id: '3', type: 'RSI', period: 6, period2: 12, period3: 24, color: '#9c27b0' },
        { id: '4', type: 'MACD', period: 12, slowPeriod: 26, signalPeriod: 9, color: '#2962ff' },
    ]);

    // Computed indicators for the chart
    const [chartIndicators, setChartIndicators] = useState<{
        sma: IndicatorSeries[],
        ema: IndicatorSeries[],
        rsi: IndicatorSeries[],
        macd: { macdLines: IndicatorSeries[], signalLines: IndicatorSeries[], histograms: IndicatorSeries[] },
        markers?: any[]
    }>({
        sma: [],
        ema: [],
        rsi: [],
        macd: { macdLines: [], signalLines: [], histograms: [] },
        markers: []
    });

    const searchInputRef = useRef<HTMLInputElement>(null);
    const [searchQuery, setSearchQuery] = useState("BTC-USD");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [refreshInterval, setRefreshInterval] = useState<number>(60000); // Default 1 minute
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'watchlist' | 'indicators' | 'settings'>('watchlist');
    const [timeToNextRefresh, setTimeToNextRefresh] = useState<number>(60); // In seconds

    const fetchData = useCallback(async (sym: string, isAutoRefresh = false) => {
        if (!sym) {
            setData([]);
            setMeta(null);
            return;
        }
        if (!isAutoRefresh) setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/stock/${sym}`);
            if (!res.ok) {
                throw new Error("Failed to fetch data.");
            }
            const json = await res.json();
            if (json.error) {
                throw new Error(json.error);
            }
            if (json.candles) {
                setData(json.candles);
                setMeta(json.meta);
            } else {
                // Fallback for old format if cached or unexpected
                setData(json);
            }
        } catch (err: any) {
            setError(err.message);
            if (!isAutoRefresh) setData([]);
        } finally {
            if (!isAutoRefresh) setLoading(false);
        }
    }, []);

    // Auto Refresh & Countdown Effect
    useEffect(() => {
        if (refreshInterval === 0 || !symbol) {
            setTimeToNextRefresh(0);
            return;
        }

        // Initialize/Reset timer when interval or symbol changes
        setTimeToNextRefresh(refreshInterval / 1000);

        const intervalId = setInterval(() => {
            setTimeToNextRefresh((prev) => {
                if (prev <= 1) {
                    fetchData(symbol, true);
                    return refreshInterval / 1000;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [refreshInterval, symbol, fetchData]);

    // Calculate indicators whenever data or activeConfig changes
    useEffect(() => {
        if (data.length === 0) return;

        const closes = data.map(d => d.close);
        const smaResults: IndicatorSeries[] = [];
        const emaResults: IndicatorSeries[] = [];
        const rsiResults: IndicatorSeries[] = [];
        const macdLines: IndicatorSeries[] = [];
        const signalLines: IndicatorSeries[] = [];
        const histograms: IndicatorSeries[] = [];
        let tdMarkers: any[] = []; // TD Sequential markers

        const align = (vals: number[], period: number) => {
            const padded = new Array(data.length - vals.length).fill(undefined);
            return [...padded, ...vals];
        };

        activeIndicators.forEach(ind => {
            try {
                if (ind.type === 'SMA') {
                    const vals = Indicators.calculateSMA(closes, ind.period);
                    smaResults.push({ values: align(vals, ind.period), color: ind.color });
                } else if (ind.type === 'EMA') {
                    const vals = Indicators.calculateEMA(closes, ind.period);
                    emaResults.push({ values: align(vals, ind.period), color: ind.color });
                } else if (ind.type === 'RSI') {
                    const vals1 = Indicators.calculateRSI(closes, ind.period);
                    rsiResults.push({ values: align(vals1, ind.period), color: ind.color });

                    if (ind.period2) {
                        const vals2 = Indicators.calculateRSI(closes, ind.period2);
                        rsiResults.push({ values: align(vals2, ind.period2), color: '#ff6d00' });
                    }
                    if (ind.period3) {
                        const vals3 = Indicators.calculateRSI(closes, ind.period3);
                        rsiResults.push({ values: align(vals3, ind.period3), color: '#ea80fc' });
                    }
                } else if (ind.type === 'TD9') {
                    const markers = Indicators.calculateTDSequential(data);
                    tdMarkers = markers;
                } else if (ind.type === 'MACD') {
                    const fast = ind.period;
                    const slow = ind.slowPeriod || 26;
                    const signal = ind.signalPeriod || 9;
                    const macdData = Indicators.calculateMACD(closes, fast, slow, signal);
                    const padding = new Array(data.length - macdData.length).fill(undefined);

                    macdLines.push({ values: [...padding, ...macdData.map(d => d.MACD)], color: ind.color });
                    signalLines.push({ values: [...padding, ...macdData.map(d => d.signal)], color: '#ff6d00' });
                    histograms.push({ values: [...padding, ...macdData.map(d => d.histogram)], color: '#26a69a' });
                }
            } catch (e) {
                console.error(`Error calculating ${ind.type}`, e);
            }
        });

        setChartIndicators({
            sma: smaResults,
            ema: emaResults,
            rsi: rsiResults,
            macd: {
                macdLines,
                signalLines,
                histograms
            },
            markers: tdMarkers
        });

    }, [data, activeIndicators]);

    useEffect(() => {
        if (symbol) {
            fetchData(symbol);
        }
    }, [fetchData, symbol]); // Added symbol dependency to initial fetch

    // Autocomplete Fetch Logic
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const res = await fetch(`/api/search?q=${searchQuery}`);
                const data = await res.json();
                if (data.quotes) {
                    setSuggestions(data.quotes);
                }
            } catch (e) {
                console.error("Error fetching suggestions", e);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);



    const addIndicator = (type: IndicatorType) => {
        if (type === 'MACD' && activeIndicators.some(ind => ind.type === 'MACD')) {
            return;
        }
        if (type === 'RSI' && activeIndicators.some(ind => ind.type === 'RSI')) {
            return;
        }
        if (type === 'TD9' && activeIndicators.some(ind => ind.type === 'TD9')) {
            return;
        }
        const id = Date.now().toString() + Math.random().toString().slice(2);
        const defaultPeriod = type === 'RSI' ? 6 : (type === 'MACD' ? 12 : 20);
        const period2 = type === 'RSI' ? 12 : undefined;
        const period3 = type === 'RSI' ? 24 : undefined;
        const slowPeriod = type === 'MACD' ? 26 : undefined;
        const signalPeriod = type === 'MACD' ? 9 : undefined;

        // Find unused colors from DEFAULT_COLORS
        const usedColors = activeIndicators.map(ind => ind.color.toLowerCase());
        const availableColors = DEFAULT_COLORS.filter(c => !usedColors.includes(c.toLowerCase()));

        let color: string;
        if (availableColors.length > 0) {
            color = availableColors[0];
        } else {
            // All defaults used, generate a random one
            let randomColor: string;
            let attempts = 0;
            do {
                randomColor = generateRandomVividColor();
                attempts++;
            } while (usedColors.includes(randomColor.toLowerCase()) && attempts < 10);
            color = randomColor;
        }

        setActiveIndicators([...activeIndicators, { id, type, period: defaultPeriod, period2, period3, slowPeriod, signalPeriod, color }]);
    };

    const removeIndicator = (id: string) => {
        setActiveIndicators(activeIndicators.filter(i => i.id !== id));
    };

    const updatePeriod = (id: string, newPeriod: number) => {
        setActiveIndicators(activeIndicators.map(i =>
            i.id === id ? { ...i, period: newPeriod } : i
        ));
    };

    const updatePeriod2 = (id: string, newPeriod: number) => {
        setActiveIndicators(activeIndicators.map(i =>
            i.id === id ? { ...i, period2: newPeriod } : i
        ));
    };

    const updatePeriod3 = (id: string, newPeriod: number) => {
        setActiveIndicators(activeIndicators.map(i =>
            i.id === id ? { ...i, period3: newPeriod } : i
        ));
    };

    const updateSlowPeriod = (id: string, newPeriod: number) => {
        setActiveIndicators(activeIndicators.map(i =>
            i.id === id ? { ...i, slowPeriod: newPeriod } : i
        ));
    };

    const updateSignalPeriod = (id: string, newPeriod: number) => {
        setActiveIndicators(activeIndicators.map(i =>
            i.id === id ? { ...i, signalPeriod: newPeriod } : i
        ));
    };

    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [isWatchlistLoaded, setIsWatchlistLoaded] = useState(false);

    // Load Watchlist from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('stock-visualizer-watchlist');
        if (saved) {
            try {
                setWatchlist(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse watchlist", e);
            }
        }
        setIsWatchlistLoaded(true);
    }, []);

    // Save Watchlist to LocalStorage
    useEffect(() => {
        if (isWatchlistLoaded) {
            localStorage.setItem('stock-visualizer-watchlist', JSON.stringify(watchlist));
        }
    }, [watchlist, isWatchlistLoaded]);

    const addToWatchlist = () => {
        if (!watchlist.includes(symbol)) {
            setWatchlist([...watchlist, symbol]);
        }
    };

    const removeFromWatchlist = (sym: string) => {
        setWatchlist(watchlist.filter(s => s !== sym));
    };

    const toggleWatchlist = () => {
        if (watchlist.includes(symbol)) {
            removeFromWatchlist(symbol);
        } else {
            addToWatchlist();
        }
    };

    return (
        <main className="flex h-screen flex-col md:flex-row bg-[#131722] text-[#d1d4dc] overflow-hidden">
            {/* Sidebar / Configuration Panel */}
            <aside
                className={`relative border-b md:border-b-0 md:border-r border-[#2a2e39] flex flex-col bg-[#1e222d] transition-all duration-300 ease-in-out shrink-0 order-last md:order-first
                    ${isSidebarCollapsed ? 'w-0 md:w-16' : 'w-full md:w-80 h-1/3 md:h-full'}`}
            >
                {/* Collapse/Expand Toggle (Desktop) */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden md:flex absolute -right-3 top-1/2 transform -translate-y-1/2 z-50 bg-[#2962ff] text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                >
                    {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                {/* Sidebar Header / Tabs */}
                {!isSidebarCollapsed && (
                    <div className="flex border-b border-[#2a2e39] shrink-0">
                        <button
                            onClick={() => setActiveSidebarTab('watchlist')}
                            className={`flex-1 p-3 flex flex-col items-center gap-1 transition-colors ${activeSidebarTab === 'watchlist' ? 'bg-[#2a2e39] text-[#2962ff]' : 'hover:bg-[#252a36]'}`}
                            title="Watchlist"
                        >
                            <List className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase">Watchlist</span>
                        </button>
                        <button
                            onClick={() => setActiveSidebarTab('indicators')}
                            className={`flex-1 p-3 flex flex-col items-center gap-1 transition-colors ${activeSidebarTab === 'indicators' ? 'bg-[#2a2e39] text-[#2962ff]' : 'hover:bg-[#252a36]'}`}
                            title="Indicators"
                        >
                            <Activity className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase">Indicators</span>
                        </button>
                        <button
                            onClick={() => setActiveSidebarTab('settings')}
                            className={`flex-1 p-3 flex flex-col items-center gap-1 transition-colors ${activeSidebarTab === 'settings' ? 'bg-[#2a2e39] text-[#2962ff]' : 'hover:bg-[#252a36]'}`}
                            title="Settings"
                        >
                            <Settings className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase">Settings</span>
                        </button>
                    </div>
                )}

                {/* Collapsed View Icons (Desktop) */}
                {isSidebarCollapsed && (
                    <div className="hidden md:flex flex-col items-center gap-6 py-8">
                        <button onClick={() => { setIsSidebarCollapsed(false); setActiveSidebarTab('watchlist'); }} className="text-[#787b86] hover:text-white transition-colors">
                            <List className="w-6 h-6" />
                        </button>
                        <button onClick={() => { setIsSidebarCollapsed(false); setActiveSidebarTab('indicators'); }} className="text-[#787b86] hover:text-white transition-colors">
                            <Activity className="w-6 h-6" />
                        </button>
                        <button onClick={() => { setIsSidebarCollapsed(false); setActiveSidebarTab('settings'); }} className="text-[#787b86] hover:text-white transition-colors">
                            <Settings className="w-6 h-6" />
                        </button>
                    </div>
                )}

                {/* Sidebar Content (Scrollable) */}
                {!isSidebarCollapsed && (
                    <div className="flex-1 overflow-y-auto">
                        {activeSidebarTab === 'watchlist' && (
                            <div className="p-4">
                                <h2 className="text-lg font-bold text-white mb-4">Watchlist</h2>
                                {watchlist.length === 0 ? (
                                    <p className="text-xs text-[#787b86] italic">No symbols saved.</p>
                                ) : (
                                    <ul className="flex flex-col gap-2">
                                        {watchlist.map(sym => (
                                            <li key={sym} className="flex items-center justify-between bg-[#2a2e39] p-2 rounded hover:bg-[#363a45] cursor-pointer group" onClick={() => {
                                                setSymbol(sym);
                                                fetchData(sym);
                                                setSearchQuery(sym);
                                            }}>
                                                <span className="text-sm font-bold text-white">{sym}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFromWatchlist(sym);
                                                    }}
                                                    className="text-[#787b86] hover:text-[#ef5350] opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {activeSidebarTab === 'indicators' && (
                            <div className="p-4 flex flex-col h-full">
                                <h2 className="text-lg font-bold text-white mb-4">Indicators</h2>
                                <div className="mb-6">
                                    <label className="text-xs text-[#787b86] mb-2 block">Quick Add</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => addIndicator('SMA')} className="px-3 py-2 bg-[#1e222d] border border-[#2a2e39] text-[#2962ff] text-xs font-bold rounded hover:bg-[#2a2e39] transition-colors">SMA</button>
                                        <button onClick={() => addIndicator('EMA')} className="px-3 py-2 bg-[#1e222d] border border-[#2a2e39] text-[#ff6d00] text-xs font-bold rounded hover:bg-[#2a2e39] transition-colors">EMA</button>
                                        <button onClick={() => addIndicator('RSI')} className="px-3 py-2 bg-[#1e222d] border border-[#2a2e39] text-[#9c27b0] text-xs font-bold rounded hover:bg-[#2a2e39] transition-colors">RSI</button>
                                        <button onClick={() => addIndicator('MACD')} className="px-3 py-2 bg-[#1e222d] border border-[#2a2e39] text-[#ffd600] text-xs font-bold rounded hover:bg-[#2a2e39] transition-colors">MACD</button>
                                        <button onClick={() => addIndicator('TD9')} className="px-3 py-2 bg-[#1e222d] border border-[#2a2e39] text-[#4caf50] text-xs font-bold rounded hover:bg-[#2a2e39] transition-colors">TD9</button>
                                    </div>
                                </div>

                                <h3 className="text-sm font-semibold text-[#d1d4dc] mb-4">Active on Chart</h3>
                                <div className="flex flex-col gap-3">
                                    {activeIndicators.map(ind => (
                                        <div key={ind.id} className="bg-[#131722] p-3 rounded border border-[#2a2e39] relative group">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium" style={{ color: ind.color }}>{ind.type}</span>
                                                <button onClick={() => removeIndicator(ind.id)} className="text-[#ef5350] opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-[#787b86] w-12">{ind.type === 'MACD' ? 'Short' : ind.type === 'RSI' ? 'RSI 1' : ind.type === 'TD9' ? 'N/A' : 'Period'}</label>
                                                    <input
                                                        type="number"
                                                        value={ind.period}
                                                        disabled={ind.type === 'TD9'}
                                                        onChange={(e) => updatePeriod(ind.id, parseInt(e.target.value) || 0)}
                                                        className={`bg-[#2a2e39] text-white text-xs rounded px-2 py-1 w-full focus:outline-none ${ind.type === 'TD9' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    />
                                                </div>
                                                {ind.type === 'RSI' && (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-[#787b86] w-12">RSI 2</label>
                                                            <input
                                                                type="number"
                                                                value={ind.period2 || 12}
                                                                onChange={(e) => updatePeriod2(ind.id, parseInt(e.target.value) || 0)}
                                                                className="bg-[#2a2e39] text-white text-xs rounded px-2 py-1 w-full focus:outline-none"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-[#787b86] w-12">RSI 3</label>
                                                            <input
                                                                type="number"
                                                                value={ind.period3 || 24}
                                                                onChange={(e) => updatePeriod3(ind.id, parseInt(e.target.value) || 0)}
                                                                className="bg-[#2a2e39] text-white text-xs rounded px-2 py-1 w-full focus:outline-none"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                                {ind.type === 'MACD' && (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-[#787b86] w-12">Long</label>
                                                            <input
                                                                type="number"
                                                                value={ind.slowPeriod || 26}
                                                                onChange={(e) => updateSlowPeriod(ind.id, parseInt(e.target.value) || 0)}
                                                                className="bg-[#2a2e39] text-white text-xs rounded px-2 py-1 w-full focus:outline-none"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-[#787b86] w-12">Signal</label>
                                                            <input
                                                                type="number"
                                                                value={ind.signalPeriod || 9}
                                                                onChange={(e) => updateSignalPeriod(ind.id, parseInt(e.target.value) || 0)}
                                                                className="bg-[#2a2e39] text-white text-xs rounded px-2 py-1 w-full focus:outline-none"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {activeIndicators.length === 0 && (
                                        <p className="text-xs text-[#787b86] italic text-center">No active indicators</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeSidebarTab === 'settings' && (
                            <div className="p-4">
                                <h2 className="text-lg font-bold text-white mb-4">Settings</h2>
                                <div className="mb-6">
                                    <label className="text-xs text-[#787b86] mb-2 block uppercase tracking-wider font-bold">Auto-Refresh Interval</label>
                                    <select
                                        value={refreshInterval}
                                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                        className="bg-[#2a2e39] text-white text-sm rounded px-3 py-2 w-full focus:outline-none border border-[#363a45] cursor-pointer"
                                    >
                                        <option value={0}>Off / Manual Only</option>
                                        <option value={5000}>5 seconds</option>
                                        <option value={10000}>10 seconds</option>
                                        <option value={30000}>30 seconds</option>
                                        <option value={60000}>1 minute</option>
                                        <option value={300000}>5 minutes</option>
                                    </select>
                                    <p className="text-[10px] text-[#787b86] mt-2 italic">Chart data will automatically update at this frequency.</p>
                                </div>

                                <div className="p-4 bg-[#2a2e39] rounded border border-[#363a45]">
                                    <h4 className="text-xs font-bold text-white mb-2 uppercase">Theme Info</h4>
                                    <p className="text-xs text-[#787b86]">Current: Deep Dark</p>
                                    <p className="text-[10px] text-[#787b86] mt-1">High-contrast visualization for professional analysis.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
                <header className="p-4 border-b border-[#2a2e39] flex items-center justify-between bg-[#131722] shrink-0">
                    <div className="flex flex-col mr-2 min-w-0">
                        <h1 className="text-xl font-bold text-[#d1d4dc] truncate">
                            {meta?.shortName || meta?.symbol || "Stock Visualizer"}
                        </h1>
                        {meta?.shortName && (
                            <span className="text-xs text-[#787b86] font-medium">{meta.symbol}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 min-w-0">
                        {data.length > 0 && (
                            <div className="hidden md:flex items-center gap-3 mr-4 whitespace-nowrap">
                                <div className={`text-2xl font-bold ${(data.length > 1 ? data[data.length - 1].close - data[data.length - 2].close : 0) > 0
                                    ? 'text-[#26a69a]'
                                    : (data.length > 1 ? data[data.length - 1].close - data[data.length - 2].close : 0) < 0
                                        ? 'text-[#ef5350]'
                                        : 'text-[#d1d4dc]'
                                    }`}>
                                    {data[data.length - 1].close.toFixed(2)}
                                </div>
                                <div className={`flex items-center text-sm font-medium ${(data.length > 1 ? data[data.length - 1].close - data[data.length - 2].close : 0) > 0
                                    ? 'text-[#26a69a]'
                                    : (data.length > 1 ? data[data.length - 1].close - data[data.length - 2].close : 0) < 0
                                        ? 'text-[#ef5350]'
                                        : 'text-[#d1d4dc]'
                                    }`}>
                                    {data.length > 1 ? (
                                        <>
                                            {(data[data.length - 1].close - data[data.length - 2].close) > 0 ? (
                                                <ArrowUp className="w-4 h-4 mr-1" />
                                            ) : (data[data.length - 1].close - data[data.length - 2].close) < 0 ? (
                                                <ArrowDown className="w-4 h-4 mr-1" />
                                            ) : null}
                                            {(data[data.length - 1].close - data[data.length - 2].close).toFixed(2)}
                                            <span className="ml-1">
                                                ({((data[data.length - 1].close - data[data.length - 2].close) / data[data.length - 2].close * 100).toFixed(2)}%)
                                            </span>
                                        </>
                                    ) : (
                                        <span>0.00 (0.00%)</span>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* 52-Week High / Low Display */}
                        {meta && (
                            <div className="hidden lg:flex items-center gap-4 mr-6 border-l border-[#2a2e39] pl-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-[#787b86] uppercase tracking-wider">52W High</span>
                                    <span className="text-sm font-bold text-[#d1d4dc]">
                                        {meta.fiftyTwoWeekHigh.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-[#787b86] uppercase tracking-wider">52W Low</span>
                                    <span className="text-sm font-bold text-[#d1d4dc]">
                                        {meta.fiftyTwoWeekLow.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Trend Indicator */}
                        {data.length > 0 && chartIndicators.sma.find((s: any) => s.color === '#00bfa5') && (
                            (() => {
                                const sma200Series = chartIndicators.sma.find((s: any) => s.color === '#00bfa5');
                                if (!sma200Series) return null;
                                const lastPrice = data[data.length - 1].close;
                                // SMA values are aligned, so last value corresponds to last candle
                                const lastSMA200 = sma200Series.values[data.length - 1];

                                if (typeof lastSMA200 === 'number') {
                                    const isBullish = lastPrice > lastSMA200;
                                    return (
                                        <div className={`hidden xl:flex items-center px-3 py-1 rounded text-xs font-bold mr-6 ${isBullish ? 'bg-[#1b5e20] text-[#4caf50]' : 'bg-[#b71c1c] text-[#ffcdd2]'}`}>
                                            {isBullish ? 'BULLISH' : 'BEARISH'}
                                        </div>
                                    );
                                }
                                return null;
                            })()
                        )}
                        <div className="relative z-50 shrink-0 flex items-center gap-2">
                            {/* Refresh Countdown */}
                            {refreshInterval > 0 && symbol && (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#1e222d] border border-[#2a2e39] rounded text-[10px] text-[#787b86] font-bold uppercase tracking-wider">
                                    <Clock className={`w-3 h-3 ${timeToNextRefresh <= 5 ? 'text-[#ef5350] animate-pulse' : 'text-[#2962ff]'}`} />
                                    <span>Refreshes in {timeToNextRefresh}s</span>
                                </div>
                            )}

                            {/* Watchlist Toggle */}
                            <button onClick={toggleWatchlist} className={`p-2 rounded hover:bg-[#2a2e39] ${watchlist.includes(symbol) ? 'text-[#ffeb3b]' : 'text-[#787b86]'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={watchlist.includes(symbol) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            </button>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search Symbol"
                                    className="bg-[#1e222d] border border-[#2a2e39] rounded pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-[#2962ff] text-white uppercase w-32 md:w-64"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#787b86]" />

                                {/* Autocomplete Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="absolute top-full left-0 w-full bg-[#1e222d] border border-[#2a2e39] rounded mt-1 max-h-60 overflow-y-auto shadow-lg">
                                        {suggestions.map((s: any) => (
                                            <li
                                                key={s.symbol}
                                                className="px-4 py-2 hover:bg-[#2a2e39] cursor-pointer flex justify-between items-center"
                                                onClick={() => {
                                                    setSymbol(s.symbol);
                                                    fetchData(s.symbol);
                                                    setSearchQuery(s.symbol); // Or clear it? keeping it synced seems better
                                                    setSuggestions([]);
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <span className="text-sm font-bold text-white">{s.symbol}</span>
                                                <span className="text-xs text-[#787b86] truncate max-w-[150px]">{s.shortname || s.longname}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 relative min-h-0 min-w-0">
                    <div className="w-full h-full border border-[#2a2e39] rounded overflow-hidden relative bg-[#131722]">
                        {loading && (
                            <div className="absolute inset-0 bg-[#131722] bg-opacity-80 z-10 flex items-center justify-center">
                                <span className="text-white">Loading...</span>
                            </div>
                        )}
                        {error ? (
                            <div className="flex items-center justify-center h-full text-[#ef5350]">
                                Error: {error}
                            </div>
                        ) : (
                            <ChartContainer data={data} indicators={chartIndicators} />
                        )}
                    </div>
                </div>
            </div >
        </main >
    );
}
