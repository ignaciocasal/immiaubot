# ImmiAuBot

A **Telegram bot** that monitors and notifies you about changes to Australian visa processing times published by the Department of Home Affairs.

## Features

- **Real-time queries** — Check processing times for any visa subclass via `/check <subclass>`.
- **Change notifications** — Get notified about visa subclasses with `/notify` and receive a Telegram message whenever the processing time estimate changes.
- **Automated daily checks** — Scheduled scraping via `daily-check` or `worker` mode. Can be run as a cron job, containerized service, or deployed to GCP.
- **Multi-stream support** — Visa subclasses with multiple streams (e.g., 482, 858) are handled with interactive inline keyboards for stream selection.
- **Inline interactions** — Stream pickers, inline subscribe buttons on check results, and interactive subscribe/unsubscribe flows via callback queries.

## Commands

| Command | Description |
|---|---|
| `/start` | Show welcome message and available commands |
| `/check <subclass>` | Get the current processing time for a visa (e.g., `/check 189`) |
| `/notify <subclass>` | Get notified when a visa's processing time changes |
| `/unsubscribe <subclass>` | Unsubscribe from change notifications |
| `/list` | Show your current subscriptions |

## How it works

1. **Data collection** — The bot fetches the full visa catalogue and processing time estimates from the Australian Home Affairs API (`immi.homeaffairs.gov.au`).
2. **Change detection** — On each run, the latest data is compared against the previous snapshot. Any change in the 90th percentile processing time is flagged.
3. **Notification** — Subscribed users receive a formatted Telegram message with the old and new processing times.

Data is stored locally as JSON files in `data/`:
- `visas.json` — full visa catalogue with streams
- `latest.json` — latest processing time estimates
- `subscriptions.json` — user subscription state

## Project structure

```
src/
├── index.ts                 # Entry point (bot / collect / daily-check / worker)
├── config.ts                # Environment config and constants
├── bot/                     # Telegram bot layer
│   ├── telegram.ts          # Bot factory
│   ├── callbackHandler.ts   # Inline keyboard callback handler
│   ├── commands/            # Command handlers
│   │   ├── start.ts
│   │   ├── check.ts
│   │   ├── notify.ts
│   │   ├── unsubscribe.ts
│   │   └── list.ts
│   └── keyboards/           # UI helpers
│       └── visaOptions.ts
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
    ├── index.ts
    └── telegram-bot.d.ts
```

## License

MIT
