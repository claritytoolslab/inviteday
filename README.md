# InviteDay

Create beautiful event invites and share them via any messaging app. Recipients can add events to their calendar with one tap.

## Architecture

```
┌─────────────────┐     Share Link      ┌─────────────────┐
│   iOS App       │ ─────────────────▶  │   GitHub Pages  │
│   (SwiftUI)     │                     │   Event Page    │
└─────────────────┘                     └─────────────────┘
                                                │
                                                │ webcal://
                                                ▼
                                        ┌─────────────────┐
                                        │   Cloudflare    │
                                        │   Worker (ICS)  │
                                        └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │   Native        │
                                        │   Calendar App  │
                                        └─────────────────┘
```

## Components

### 1. iOS App
- Create events manually or import from device calendar
- Generate shareable invite links
- Share via WhatsApp, iMessage, etc.

### 2. Web Page (GitHub Pages)
- Display event details with beautiful pastel UI
- Three calendar buttons: Google, Apple/iOS, Outlook
- URL: `https://claritytoolslab.github.io/inviteday/`

### 3. Cloudflare Worker (ICS Generator)
- Generates ICS calendar files dynamically
- Supports `webcal://` protocol for native calendar integration
- Free tier, no server management

## URL Parameters

The event page accepts these query parameters:

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `title` | Yes | Event name (URL encoded) | `Birthday%20Party` |
| `start` | Yes | Start time (ISO 8601) | `2025-03-10T18:00:00+02:00` |
| `end` | Yes | End time (ISO 8601) | `2025-03-10T21:00:00+02:00` |
| `tz` | Yes | Timezone (IANA) | `Europe/Helsinki` |
| `desc` | No | Description (URL encoded) | `Bring%20cake!` |

Example URL:
```
https://claritytoolslab.github.io/inviteday/?title=Birthday&start=2025-03-10T18:00:00%2B02:00&end=2025-03-10T21:00:00%2B02:00&tz=Europe/Helsinki&desc=Bring%20cake!
```

## Cloudflare Worker Setup

### Deployment Steps

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Navigate to worker directory:
```bash
cd cloudflare-worker
```

4. Deploy:
```bash
wrangler deploy
```

5. Note your worker URL (e.g., `https://inviteday-ics.YOUR-SUBDOMAIN.workers.dev`)

6. Update `ICS_WORKER_HOST` in `inviteday/script.js`:
```javascript
const ICS_WORKER_HOST = 'inviteday-ics.YOUR-SUBDOMAIN.workers.dev';
```

### Worker Endpoint

**URL:** `https://inviteday-ics.YOUR-SUBDOMAIN.workers.dev/`

**Parameters:** Same as web page (`title`, `start`, `end`, `desc`, `tz`)

**Response:** ICS file with headers:
- `Content-Type: text/calendar; charset=utf-8`
- `Content-Disposition: attachment; filename="invite.ics"`

### ICS File Format

The worker generates standard VCALENDAR format:

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//InviteDay//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:unique-id@inviteday.app
DTSTAMP:20250101T120000Z
DTSTART:20250310T160000Z
DTEND:20250310T190000Z
SUMMARY:Event Title
DESCRIPTION:Event description
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: Event Title
END:VALARM
END:VEVENT
END:VCALENDAR
```

## Calendar Integration

### webcal:// Protocol

The Apple/iOS button uses `webcal://` protocol:

```
webcal://inviteday-ics.YOUR-SUBDOMAIN.workers.dev/?title=...&start=...
```

**Platform Behavior:**

| Platform | Result |
|----------|--------|
| iPhone/iPad | Apple Calendar opens with "Add Event" dialog |
| Android | Google Calendar or calendar picker dialog |
| Mac | Apple Calendar opens |
| Windows | Default calendar app (Outlook, etc.) |

### Google Calendar

Uses Google Calendar URL template:
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...
```

### Outlook

Uses Outlook.com deep link:
```
https://outlook.live.com/calendar/0/deeplink/compose?path=...&rru=addevent&subject=...
```

## Development

### Web Page
```bash
cd inviteday
# Open index.html in browser or use local server
python -m http.server 8000
```

### iOS App
1. Open `InviteDay.xcodeproj` in Xcode
2. Build and run (Cmd+R)

## File Structure

```
inviteday/
├── README.md
├── cloudflare-worker/
│   ├── worker.js          # ICS generator worker
│   └── wrangler.toml      # Cloudflare config
└── inviteday/
    ├── index.html         # Event page
    ├── styles.css         # Pastel UI styles
    └── script.js          # Calendar integration
```

## Known Issues

### UTF-8 Encoding
Finnish characters (ä, ö) are properly handled via `decodeURIComponent()` in both web page and worker.

### iOS Browser Handling
All iOS browsers (Safari, Chrome, Edge) use WebKit and handle `webcal://` the same way - by opening Apple Calendar.

## License

MIT
