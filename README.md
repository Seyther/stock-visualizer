# Stock Visualizer

A responsive, dark-themed stock visualizer web application built with Next.js, React, and Tailwind CSS. It provides interactive charts, real-time stock data visualization, and a suite of configurable technical indicators for market analysis.

## 🚀 Features

- **Interactive Charts**: Powered by TradingView's Lightweight Charts for high-performance, interactive financial data visualization.
- **Real-Time Data**: Fetch and display live stock data with auto-refresh functionality.
- **Configurable Technical Indicators**:
  - **MACD** (Moving Average Convergence Divergence) with adjustable short cycle, long cycle, and signal periods.
  - **RSI** (Relative Strength Index) displayed in a persistent, synchronized sub-chart.
  - **Volume** profiling in a separate synchronized pane.
  - **TD Sequential** for advanced trend analysis and exhaustion points.
- **Dynamic UI**: Responsive dark mode design optimized for various device sizes.
- **Trend & Price Data**: Displays current stock price, bullish/bearish directional indicators, and 52-week high/low data.
- **Smart Search & Watchlist**: Symbol search bar with autocomplete, along with a watchlist feature for managing and quickly switching between favorite stocks.
- **Configurable Defaults**: Set your preferred default indicators to load automatically upon opening a chart.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI & Styling**: React, [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [`lightweight-charts`](https://tradingview.github.io/lightweight-charts/) (TradingView)
- **Technical Analysis**: [`technicalindicators`](https://github.com/anandanand84/technicalindicators)

## 📦 Getting Started

### Prerequisites
- Node.js 18+ and npm (or pnpm/yarn)

### Local Development

1. Clone the repository and navigate to the project directory:
   ```bash
   cd stock-visualizer
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 🐳 Docker Support

The project includes a `Dockerfile` and `docker-compose.yaml` for easy containerization and deployment.

### Using Docker Compose (Recommended)

To build and start the application in a Docker container:
```bash
docker-compose up -d --build
```
The application will be accessible at [http://localhost:3000](http://localhost:3000).

### Using Docker (Standalone)

Build the image:
```bash
docker build -t stock-visualizer .
```

Run the container:
```bash
docker run -p 3000:3000 stock-visualizer
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
