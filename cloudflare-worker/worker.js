/**
 * InviteDay - Cloudflare Worker ICS Generator
 *
 * Generates ICS calendar files from URL parameters.
 * Supports webcal:// protocol for direct calendar app integration.
 *
 * Endpoint: https://inviteday-ics.YOUR-SUBDOMAIN.workers.dev/
 *
 * Parameters:
 *   - title: Event title (URL encoded)
 *   - start: Start time in ISO 8601 format (e.g., 2025-03-10T18:00:00+02:00)
 *   - end: End time in ISO 8601 format
 *   - desc: Optional description (URL encoded)
 *   - tz: Optional timezone (IANA format, e.g., Europe/Helsinki)
 */

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    try {
      const url = new URL(request.url);
      const params = url.searchParams;

      // Get and decode parameters
      const title = decodeParam(params.get('title')) || 'Untitled Event';
      const startISO = params.get('start');
      const endISO = params.get('end');
      const desc = decodeParam(params.get('desc')) || '';
      const tz = params.get('tz') || 'UTC';

      // Validate required parameters
      if (!startISO || !endISO) {
        return new Response('Missing required parameters: start and end', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // Parse dates
      const startDate = parseISODate(startISO);
      const endDate = parseISODate(endISO);

      if (!startDate || !endDate) {
        return new Response('Invalid date format. Use ISO 8601 (e.g., 2025-03-10T18:00:00+02:00)', {
          status: 400,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // Generate ICS content
      const icsContent = generateICS({
        title,
        startDate,
        endDate,
        description: desc,
        timezone: tz,
      });

      // Return ICS file
      return new Response(icsContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="invite.ics"',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      return new Response(`Error generating calendar file: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  },
};

/**
 * Safely decode URL parameter with UTF-8 support
 */
function decodeParam(value) {
  if (!value) return '';
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch (e) {
    return value;
  }
}

/**
 * Parse ISO 8601 date string to Date object
 * Handles timezone offsets like +02:00
 */
function parseISODate(isoString) {
  if (!isoString) return null;

  // Try native parsing first
  let date = new Date(isoString);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Manual parsing for edge cases
  const regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-](\d{2}):(\d{2})|Z)?$/;
  const match = isoString.match(regex);

  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    const seconds = parseInt(match[6], 10);

    date = new Date(Date.UTC(year, month, day, hours, minutes, seconds));

    if (match[7] && match[7] !== 'Z') {
      const sign = match[7].charAt(0) === '+' ? -1 : 1;
      const offsetHours = parseInt(match[8], 10);
      const offsetMinutes = parseInt(match[9], 10);
      const offsetMs = sign * (offsetHours * 60 + offsetMinutes) * 60 * 1000;
      date = new Date(date.getTime() + offsetMs);
    }

    return date;
  }

  return null;
}

/**
 * Format Date to ICS datetime format (YYYYMMDDTHHmmssZ)
 */
function formatICSDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Generate unique ID for the event
 */
function generateUID() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}@inviteday.app`;
}

/**
 * Generate ICS calendar content
 */
function generateICS({ title, startDate, endDate, description, timezone }) {
  const uid = generateUID();
  const dtstamp = formatICSDate(new Date());
  const dtstart = formatICSDate(startDate);
  const dtend = formatICSDate(endDate);
  const summary = escapeICS(title);
  const desc = escapeICS(description);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//InviteDay//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
  ];

  // Add description if present
  if (desc) {
    lines.push(`DESCRIPTION:${desc}`);
  }

  // Add 1-day reminder alarm
  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${summary}`,
    'END:VALARM'
  );

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}
