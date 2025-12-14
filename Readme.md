# Stock Quiz

A stock/coin chart quiz application with multiple deployment versions.

## Overview

This project provides an interactive quiz application for stock and cryptocurrency charts. Users are presented with historical chart data and important metadata, then challenged to predict target prices and dates.

### Main Features
- **Chart Display**: Visual representation of stock/coin price movements
- **Metadata Information**: Key market indicators and relevant data points
- **User Predictions**: Set target price and date predictions
- **Interactive Quiz Format**: Test your market analysis skills

## Deployment Versions

The application is available in two publish versions:

### Version 1: MCP Server

Model Context Protocol (MCP) server implementation that allows AI assistants to interact with the stock quiz functionality.

#### Features
- MCP-compliant server interface
- Integration with AI assistants (Claude, etc.)
- Programmatic access to quiz functionality
- Real-time stock/crypto chart data

#### Installation

```bash
npm install
```

#### Usage

```bash
npm start
```

### Version 2: Web Server

Direct web hosting implementation for browser-based access.

#### Features
- Web-based user interface
- Direct browser access without additional setup
- Interactive chart visualization
- User-friendly input forms for price and date predictions
- Real-time quiz feedback

#### Installation

```bash
npm install
```

#### Usage

```bash
npm run serve
```

Access the application at `http://localhost:3000` (or configured port).

## Project Structure

```
stock_quiz/
├── Readme.md
└── [Additional files to be added]
```

## Development

### Prerequisites
- Node.js (recommended version)
- npm or yarn
- Python >=3.10
- uv (Python package installer)

### Setup

1. Clone the repository

2. Install Node.js dependencies:
```bash
npm install
```

3. Create Python virtual environment with uv:
```bash
uv venv
```

4. Activate virtual environment:
```bash
# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

5. Install Python dependencies:
```bash
uv pip install -e .
```

Or alternatively:
```bash
uv pip install yfinance pandas numpy
```

6. Run tests to verify setup:
```bash
npm test
```

7. Start the servers:
```bash
# MCP Server
npm start

# Web Server
npm run serve
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Add your license here]