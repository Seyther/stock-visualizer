export async function GET(request: Request, { params }: { params: { symbol: string } }) {
    const symbol = params.symbol.toUpperCase();
    const range = "2y";
    const interval = "1d";
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;

    try {
        const [chartRes, quoteRes] = await Promise.all([
            fetch(chartUrl),
            fetch(quoteUrl)
        ]);

        const chartData = await chartRes.json();
        const quoteData = await quoteRes.json();

        if (chartData.chart.error) {
            return new Response(JSON.stringify({ error: chartData.chart.error.description }), { status: 400 });
        }

        const result = chartData.chart.result[0];
        const quote = result.indicators.quote[0];
        const timestamps = result.timestamp;

        const meta = result.meta || {};
        const fiftyTwoWeekHigh = meta.fiftyTwoWeekHigh || 0;
        const fiftyTwoWeekLow = meta.fiftyTwoWeekLow || 0;

        // Extract basic info from quote if available
        let shortName = "";
        let longName = "";

        if (quoteData.quoteResponse && quoteData.quoteResponse.result && quoteData.quoteResponse.result.length > 0) {
            const q = quoteData.quoteResponse.result[0];
            shortName = q.shortName || "";
            longName = q.longName || "";
        }

        const candles = timestamps.map((timestamp: number, index: number) => {
            return {
                time: new Date(timestamp * 1000).toISOString().split('T')[0],
                open: quote.open[index],
                high: quote.high[index],
                low: quote.low[index],
                close: quote.close[index],
                volume: quote.volume[index],
            };
        }).filter((candle: any) => candle.open !== null && candle.close !== null);

        return new Response(JSON.stringify({
            candles,
            meta: {
                fiftyTwoWeekHigh,
                fiftyTwoWeekLow,
                shortName,
                longName,
                symbol
            }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch data" }), { status: 500 });
    }
}
