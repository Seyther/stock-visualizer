export type CandleData = {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

export const generateMockData = (numberOfCandles: number = 200): CandleData[] => {
    const data: CandleData[] = [];
    let currentPrice = 150;
    let time = new Date();
    time.setHours(0, 0, 0, 0);

    // Go back N days
    time.setDate(time.getDate() - numberOfCandles);

    for (let i = 0; i < numberOfCandles; i++) {
        const volatility = 2; // Price movement definition
        const change = (Math.random() - 0.5) * volatility;
        const open = currentPrice;
        const close = currentPrice + change;
        const high = Math.max(open, close) + Math.random() * volatility * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * 0.5;
        const volume = Math.floor(Math.random() * 10000) + 1000;

        // Format date as YYYY-MM-DD
        const timeString = time.toISOString().split('T')[0];

        data.push({
            time: timeString,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2)),
            volume,
        });

        currentPrice = close;
        // Advance one day (skip weekends if we wanted to be fancy, but simple for now)
        time.setDate(time.getDate() + 1);
    }

    return data;
};
