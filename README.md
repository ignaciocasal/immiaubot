# ImmiAuBot

A **Telegram bot** that monitors and notifies you about changes to Australian visa processing times published by the Department of Home Affairs.

## Features

- **Real-time queries** — Check processing times for any visa subclass via `/check <subclass>`.
- **Change notifications** — Subscribe to visa subclasses with `/subscribe` and receive a Telegram message whenever the processing time estimate changes.
- **Automated daily checks** — A GitHub Actions workflow scrapes the official Home Affairs website daily and pushes notifications to subscribed users.
- **Multi-stream support** — Visa subclasses with multiple streams (e.g., 482, 858) are handled with an interactive stream picker.

## Commands

| Command | Description |
|---|---|
| `/start` | Show welcome message and available commands |
| `/check <subclass>` | Get the current processing time for a visa (e.g., `/check 189`) |
| `/subscribe <subclass>` | Subscribe to change notifications for a visa |
| `/unsubscribe <subclass>` | Unsubscribe from change notifications |

## How it works

1. **Data collection** — The bot fetches the full visa catalogue and processing time estimates from the Australian Home Affairs API (`immi.homeaffairs.gov.au`).
2. **Change detection** — On each run, the latest data is compared against the previous snapshot. Any change in the 90th percentile processing time is flagged.
3. **Notification** — Subscribed users receive a formatted Telegram message with the old and new processing times.

Data is stored locally as JSON files in `data/`.

## Setup

### Prerequisites

- Node.js 20+
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))

### Installation

```bash
git clone <repo-url>
cd ImmiAuBot
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### Running

```bash
# Start the interactive bot (polling mode)
npm run dev

# One-shot data collection
npm run collect

# Run the full daily check pipeline
npm run daily-check
```

### GitHub Actions (optional)

To enable automated daily checks, add your `TELEGRAM_BOT_TOKEN` to the repository's GitHub Secrets. The workflow runs daily at midnight UTC.

## Project structure

```
src/
├── index.ts                 # Entry point (bot / collect / daily-check)
├── config.ts                # Environment config and constants
├── bot/                     # Telegram bot layer
│   ├── telegram.ts          # Bot factory
│   ├── commands/            # Command handlers
│   └── keyboards/           # UI helpers
├── immi/                    # Home Affairs API data collection
│   ├── fetchVisas.ts        # Visa catalogue fetcher
│   ├── fetchEstimate.ts     # Processing time fetcher
│   ├── normalize.ts         # API response normalizer
│   └── collectAll.ts        # Full collection orchestrator
├── jobs/                    # Business logic
│   ├── dailyCheck.ts        # Daily pipeline
│   ├── detectChanges.ts     # Change detection
│   └── notifyUsers.ts       # Telegram notification sender
├── storage/                 # JSON file persistence
│   ├── readJson.ts
│   ├── writeJson.ts
│   └── atomicWrite.ts
└── types/                   # TypeScript type definitions
    └── index.ts
```

## License

MIT
