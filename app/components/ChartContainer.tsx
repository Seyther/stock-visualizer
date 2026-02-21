"use client";

import { createChart, ColorType, IChartApi, ISeriesApi, Time, MouseEventParams } from "lightweight-charts";
import React, { useEffect, useRef } from "react";
import { CandleData } from "../lib/dataParams";

interface IndicatorSeries {
    values: (number | undefined)[];
    color: string;
}

interface ChartContainerProps {
    data: CandleData[];
    indicators?: {
        sma?: IndicatorSeries[];
        ema?: IndicatorSeries[];
        rsi?: IndicatorSeries[];
        macd?: {
            macdLines: IndicatorSeries[];
            signalLines: IndicatorSeries[];
            histograms: IndicatorSeries[];
        };
        markers?: any[];
    };
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ data, indicators }) => {
    const mainChartContainerRef = useRef<HTMLDivElement>(null);
    const volumeChartContainerRef = useRef<HTMLDivElement>(null);
    const rsiChartContainerRef = useRef<HTMLDivElement>(null);
    const macdChartContainerRef = useRef<HTMLDivElement>(null);

    const mainChartRef = useRef<IChartApi | null>(null);
    const volumeChartRef = useRef<IChartApi | null>(null);
    const rsiChartRef = useRef<IChartApi | null>(null);
    const macdChartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!mainChartContainerRef.current || !volumeChartContainerRef.current || !rsiChartContainerRef.current || !macdChartContainerRef.current) return;

        // --- Main Chart ---
        const mainChart = createChart(mainChartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "#131722" },
                textColor: "#d1d4dc",
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: "#2B2B43" },
                horzLines: { color: "#2B2B43" },
            },
            width: mainChartContainerRef.current.clientWidth,
            height: mainChartContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: '#2B2B43',
            },
        });
        mainChartRef.current = mainChart;

        const candleSeries = mainChart.addCandlestickSeries({
            upColor: "#26a69a",
            downColor: "#ef5350",
            borderVisible: false,
            wickUpColor: "#26a69a",
            wickDownColor: "#ef5350",
        });

        // --- Volume Chart ---
        const volumeChart = createChart(volumeChartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "#131722" },
                textColor: "#d1d4dc",
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: "#2B2B43" },
                horzLines: { color: "#2B2B43" },
            },
            width: volumeChartContainerRef.current.clientWidth,
            height: volumeChartContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: '#2B2B43',
            },
        });
        volumeChartRef.current = volumeChart;

        const volumeSeries = volumeChart.addHistogramSeries({
            color: "#26a69a",
            priceFormat: { type: "volume" },
        });

        // Formatting Data
        const chartData = data.map(d => ({
            time: d.time as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

        const volumeData = data.map((d) => ({
            time: d.time as Time,
            value: d.volume,
            color: d.close >= d.open ? "#26a69a80" : "#ef535080",
        }));



        candleSeries.setData(chartData);
        volumeSeries.setData(volumeData);

        if (indicators?.markers) {
            candleSeries.setMarkers(indicators.markers);
        }

        // Overlays (Main Chart)
        if (indicators) {
            if (indicators.sma) {
                indicators.sma.forEach(ind => {
                    const smaSeries = mainChart.addLineSeries({
                        color: ind.color,
                        lineWidth: 2,
                        priceScaleId: 'right',
                        crosshairMarkerVisible: false,
                    });
                    const smaData = data.map((d, i) => ({
                        time: d.time as Time,
                        value: ind.values[i],
                    })).filter(d => d.value !== undefined && !isNaN(d.value as number));
                    smaSeries.setData(smaData as any);
                });
            }
            if (indicators.ema) {
                indicators.ema.forEach(ind => {
                    const emaSeries = mainChart.addLineSeries({
                        color: ind.color,
                        lineWidth: 2,
                        priceScaleId: 'right',
                        crosshairMarkerVisible: false,
                    });
                    const emaData = data.map((d, i) => ({
                        time: d.time as Time,
                        value: ind.values[i],
                    })).filter(d => d.value !== undefined && !isNaN(d.value as number));
                    emaSeries.setData(emaData as any);
                });
            }
        }

        // --- MACD Chart ---
        const macdChart = createChart(macdChartContainerRef.current!, {
            layout: {
                background: { type: ColorType.Solid, color: "#131722" },
                textColor: "#d1d4dc",
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: "#2B2B43" },
                horzLines: { color: "#2B2B43" },
            },
            width: macdChartContainerRef.current!.clientWidth,
            height: macdChartContainerRef.current!.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: '#2B2B43',
            },
        });
        macdChartRef.current = macdChart;

        if (indicators?.macd) {
            const { macdLines, signalLines, histograms } = indicators.macd;

            macdLines.forEach(line => {
                const s = macdChart.addLineSeries({ color: line.color, lineWidth: 2, crosshairMarkerVisible: false });
                s.setData(data.map((d, i) => ({ time: d.time as Time, value: line.values[i] })).filter(v => v.value !== undefined && !isNaN(v.value as number)));
            });

            signalLines.forEach(line => {
                const s = macdChart.addLineSeries({ color: line.color, lineWidth: 2, crosshairMarkerVisible: false });
                s.setData(data.map((d, i) => ({ time: d.time as Time, value: line.values[i] })).filter(v => v.value !== undefined && !isNaN(v.value as number)));
            });

            histograms.forEach(hist => {
                const s = macdChart.addHistogramSeries({
                    color: hist.color,
                    priceFormat: { type: 'volume' }
                });
                s.setData(data.map((d, i) => ({
                    time: d.time as Time,
                    value: hist.values[i],
                    color: (hist.values[i] || 0) >= 0 ? '#26a69a80' : '#ef535080'
                })).filter(v => v.value !== undefined && !isNaN(v.value as number)));
            });
        }

        // --- RSI Chart ---
        const rsiChart = createChart(rsiChartContainerRef.current!, {
            layout: {
                background: { type: ColorType.Solid, color: "#131722" },
                textColor: "#d1d4dc",
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: "#2B2B43" },
                horzLines: { color: "#2B2B43" },
            },
            width: rsiChartContainerRef.current!.clientWidth,
            height: rsiChartContainerRef.current!.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: '#2B2B43',
            },
        });
        rsiChartRef.current = rsiChart;

        // Add RSI Lines
        if (indicators && indicators.rsi) {
            indicators.rsi.forEach(ind => {
                const rsiSeries = rsiChart.addLineSeries({
                    color: ind.color,
                    lineWidth: 2,
                    crosshairMarkerVisible: false,
                });

                const rsiData = data.map((d, i) => ({
                    time: d.time as Time,
                    value: ind.values[i],
                })).filter(d => d.value !== undefined && !isNaN(d.value as number));

                rsiSeries.setData(rsiData as any);
            });
        }

        // Baseline 70/30
        const upperLine = rsiChart.addLineSeries({
            color: '#ef5350', lineWidth: 1, lineStyle: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false,
        });
        upperLine.setData(data.map(d => ({ time: d.time as Time, value: 70 })));

        const lowerLine = rsiChart.addLineSeries({
            color: '#26a69a', lineWidth: 1, lineStyle: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false,
        });
        lowerLine.setData(data.map(d => ({ time: d.time as Time, value: 30 })));



        // --- Synchronization ---
        const charts = [mainChart, volumeChart, rsiChart, macdChart].filter(Boolean) as IChartApi[];
        const timeScales = charts.map(c => c.timeScale());

        let isSyncing = false;

        timeScales.forEach((ts, index) => {
            ts.subscribeVisibleTimeRangeChange((range) => {
                if (isSyncing || !range || range.from === null || range.to === null) return;
                isSyncing = true;
                timeScales.forEach((otherTs, otherIndex) => {
                    if (index !== otherIndex) {
                        try {
                            otherTs.setVisibleRange(range);
                        } catch (e) {
                            // Occasionally charts might not be ready yet
                            console.warn('Failed to sync time range:', e);
                        }
                    }
                });
                isSyncing = false;
            });
        });


        const handleResize = () => {
            const resizeChart = (
                container: HTMLDivElement | null,
                chart: IChartApi | null
            ) => {
                if (container && chart) {
                    const { clientWidth, clientHeight } = container;
                    chart.applyOptions({ width: clientWidth, height: clientHeight });
                }
            };

            resizeChart(mainChartContainerRef.current, mainChartRef.current);
            resizeChart(volumeChartContainerRef.current, volumeChartRef.current);
            resizeChart(rsiChartContainerRef.current, rsiChartRef.current);
            resizeChart(macdChartContainerRef.current, macdChartRef.current);
        };

        const resizeObserver = new ResizeObserver(() => {
            // RequestAnimationFrame to debounce/throttle slightly and prevent "ResizeObserver loop limit exceeded"
            requestAnimationFrame(handleResize);
        });

        if (mainChartContainerRef.current) resizeObserver.observe(mainChartContainerRef.current);
        if (volumeChartContainerRef.current) resizeObserver.observe(volumeChartContainerRef.current);
        if (rsiChartContainerRef.current) resizeObserver.observe(rsiChartContainerRef.current);
        if (macdChartContainerRef.current) resizeObserver.observe(macdChartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            mainChart.remove();
            volumeChart.remove();
            rsiChart?.remove();
            macdChart?.remove();
        };
    }, [data, indicators]);

    return (
        <div className="w-full h-full flex flex-col gap-1">
            {/* Main Chart */}
            <div ref={mainChartContainerRef} className="w-full relative" style={{ height: '55%' }} />

            {/* Volume Chart */}
            <div ref={volumeChartContainerRef} className="w-full relative border-t border-[#2a2e39]" style={{ height: '15%' }} />

            {/* MACD Chart */}
            <div ref={macdChartContainerRef} className="w-full relative border-t border-[#2a2e39]" style={{ height: '15%' }} />

            {/* RSI Chart */}
            <div ref={rsiChartContainerRef} className="w-full relative border-t border-[#2a2e39]" style={{ height: '15%' }} />
        </div>
    );
};
