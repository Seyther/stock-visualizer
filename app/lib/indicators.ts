// We will use import() types or require for technicalindicators to avoid build errors if not installed yet
// But since we are writing TS, we declare the usage.
import { SMA, EMA, RSI, MACD } from 'technicalindicators';
import { CandleData } from './dataParams';

export const calculateSMA = (values: number[], period: number) => {
    return SMA.calculate({ period, values });
};

export const calculateEMA = (values: number[], period: number) => {
    return EMA.calculate({ period, values });
};

export const calculateRSI = (values: number[], period: number) => {
    return RSI.calculate({ period, values });
};

export const calculateMACD = (values: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    return MACD.calculate({
        values,
        fastPeriod,
        slowPeriod,
        signalPeriod,
        SimpleMAOscillator: false,
        SimpleMASignal: false
    })
}

export const calculateTDSequential = (data: CandleData[]) => {
    const markers: any[] = [];
    let buySetup = 0;
    let sellSetup = 0;

    for (let i = 4; i < data.length; i++) {
        const close = data[i].close;
        const close4 = data[i - 4].close;

        // Buy Setup (Price < Price 4 bars ago)
        if (close < close4) {
            buySetup++;
            sellSetup = 0; // Reset Sell Setup
        } else {
            buySetup = 0; // Interrupted
        }

        // Sell Setup (Price > Price 4 bars ago)
        if (close > close4) {
            sellSetup++;
            buySetup = 0; // Reset Buy Setup
        } else {
            sellSetup = 0; // Interrupted
        }

        // Add Markers for 1-9
        if (buySetup > 0 && buySetup <= 9) {
            markers.push({
                time: data[i].time,
                position: 'belowBar',
                color: buySetup === 9 ? '#00FF00' : '#26a69a', // Bright Green for 9
                shape: 'arrowUp',
                text: buySetup.toString(),
                size: buySetup === 9 ? 2 : 1 // Larger for 9
            });
        }

        if (sellSetup > 0 && sellSetup <= 9) {
            markers.push({
                time: data[i].time,
                position: 'aboveBar',
                color: sellSetup === 9 ? '#FF0000' : '#ef5350', // Bright Red for 9
                shape: 'arrowDown',
                text: sellSetup.toString(),
                size: sellSetup === 9 ? 2 : 1 // Larger for 9
            });
        }
    }
    return markers;
};
