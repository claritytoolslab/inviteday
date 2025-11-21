/**
 * InviteDay - Event Page Script
 * Handles URL parsing, event display, and calendar integration
 */

// ========================================
// Parse URL Parameters
// ========================================

function getURLParameters() {
    const params = new URLSearchParams(window.location.search);
    return {
        title: params.get('title') || 'Untitled Event',
        start: params.get('start'),
        end: params.get('end'),
        tz: params.get('tz') || 'UTC',
        desc: params.get('desc') || '',
        img: params.get('img') || ''
    };
}

// ========================================
// Robust ISO Date Parsing (Safari compatible)
// ========================================

function parseISODate(isoString) {
    // Safari doesn't always handle timezone offsets correctly
    // Parse manually to ensure cross-browser compatibility
    if (!isoString) return null;

    // Try native parsing first
    let date = new Date(isoString);
    if (!isNaN(date.getTime())) {
        return date;
    }

    // Manual parsing for Safari compatibility
    // Format: 2026-01-31T16:00:00+02:00 or 2026-01-31T16:00:00Z
    const regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-](\d{2}):(\d{2})|Z)?$/;
    const match = isoString.match(regex);

    if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
        const day = parseInt(match[3], 10);
        const hours = parseInt(match[4], 10);
        const minutes = parseInt(match[5], 10);
        const seconds = parseInt(match[6], 10);

        // Create date in UTC first
        date = new Date(Date.UTC(year, month, day, hours, minutes, seconds));

        // Apply timezone offset if present
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

// ========================================
// Date & Time Formatting
// ========================================

function formatEventDateTime(startISO, endISO, timezone) {
    try {
        const startDate = parseISODate(startISO);
        const endDate = parseISODate(endISO);

        if (!startDate || !endDate) {
            throw new Error('Failed to parse dates');
        }

        // Format date: "Saturday, March 1, 2025"
        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: timezone
        };
        const formattedDate = startDate.toLocaleDateString('en-US', dateOptions);

        // Format time: "6:00 PM – 9:00 PM"
        const timeOptions = {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: timezone
        };
        const startTime = startDate.toLocaleTimeString('en-US', timeOptions);
        const endTime = endDate.toLocaleTimeString('en-US', timeOptions);
        const formattedTime = `${startTime} – ${endTime}`;

        return {
            date: formattedDate,
            time: formattedTime
        };
    } catch (error) {
        console.error('Error formatting date/time:', error);
        return {
            date: 'Date unavailable',
            time: 'Time unavailable'
        };
    }
}

// ========================================
// Google Calendar URL Generation
// ========================================

function generateGoogleCalendarURL(title, startISO, endISO, description, timezone) {
    try {
        const startDate = parseISODate(startISO);
        const endDate = parseISODate(endISO);

        if (!startDate || !endDate) {
            throw new Error('Failed to parse dates');
        }

        // Format: YYYYMMDDTHHMMSSZ
        const formatDateForGoogle = (date) => {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
        };

        const startFormatted = formatDateForGoogle(startDate);
        const endFormatted = formatDateForGoogle(endDate);
        const dates = `${startFormatted}/${endFormatted}`;

        const baseURL = 'https://calendar.google.com/calendar/render';
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            dates: dates,
            details: description,
            ctz: timezone
        });

        return `${baseURL}?${params.toString()}`;
    } catch (error) {
        console.error('Error generating Google Calendar URL:', error);
        return null;
    }
}

// ========================================
// Outlook Calendar URL Generation
// ========================================

function generateOutlookCalendarURL(title, startISO, endISO, description) {
    try {
        const baseURL = 'https://outlook.live.com/calendar/0/deeplink/compose';
        const params = new URLSearchParams({
            path: '/calendar/action/compose',
            rru: 'addevent',
            subject: title,
            startdt: startISO,
            enddt: endISO,
            body: description
        });

        return `${baseURL}?${params.toString()}`;
    } catch (error) {
        console.error('Error generating Outlook Calendar URL:', error);
        return null;
    }
}

// ========================================
// ICS File Generation (Apple/iOS/Other)
// ========================================

function generateICSFile(title, startISO, endISO, description, timezone) {
    try {
        const startDate = parseISODate(startISO);
        const endDate = parseISODate(endISO);
        const now = new Date();

        if (!startDate || !endDate) {
            throw new Error('Failed to parse dates');
        }

        // Format dates for ICS (YYYYMMDDTHHMMSSZ)
        const formatDateForICS = (date) => {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
        };

        const uid = `${Date.now()}@inviteday.app`;
        const dtstamp = formatDateForICS(now);
        const dtstart = formatDateForICS(startDate);
        const dtend = formatDateForICS(endDate);

        // Clean description (escape special characters)
        const cleanDescription = description.replace(/\n/g, '\\n').replace(/,/g, '\\,');

        // Build ICS content
        const icsContent = [
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
            `SUMMARY:${title}`,
            description ? `DESCRIPTION:${cleanDescription}` : '',
            'BEGIN:VALARM',
            'TRIGGER:-P1D',
            'ACTION:DISPLAY',
            'DESCRIPTION:Reminder: ' + title,
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR'
        ].filter(line => line).join('\r\n');

        return icsContent;
    } catch (error) {
        console.error('Error generating ICS file:', error);
        return null;
    }
}

function downloadICSFile(icsContent, filename = 'invite.ics') {
    try {
        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOS) {
            // For iOS: Use data URI approach which works better
            const dataUri = 'data:text/calendar,' + encodeURIComponent(icsContent);
            window.open(dataUri, '_blank');

            // Show helpful message for iOS users
            setTimeout(() => {
                alert('Calendar file opened. Tap "Add" or "Add All" to save the event to your calendar.');
            }, 500);
        } else {
            // For other devices: Use blob download
            const blob = new Blob([icsContent], { type: 'text/calendar' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Error downloading ICS file:', error);
        // Fallback: try data URI for all
        try {
            const dataUri = 'data:text/calendar,' + encodeURIComponent(icsContent);
            window.open(dataUri, '_blank');
        } catch (fallbackError) {
            alert('Could not create calendar event. Please try Google Calendar instead.');
        }
    }
}

// ========================================
// Display Event Information
// ========================================

function displayEventInfo(eventData) {
    // Title
    document.getElementById('eventTitle').textContent = eventData.title;

    // Date & Time
    const { date, time } = formatEventDateTime(eventData.start, eventData.end, eventData.tz);
    document.getElementById('eventDate').textContent = date;
    document.getElementById('eventTime').textContent = time;

    // Description (optional)
    if (eventData.desc) {
        document.getElementById('descriptionText').textContent = eventData.desc;
        document.getElementById('descriptionSection').style.display = 'block';
    }

    // Image (optional - not implemented in v1)
    if (eventData.img) {
        document.getElementById('eventImage').src = eventData.img;
        document.getElementById('imageSection').style.display = 'block';
    }
}

// ========================================
// Setup Calendar Button Handlers
// ========================================

function setupCalendarButtons(eventData) {
    // Google Calendar Button
    const googleBtn = document.getElementById('googleBtn');
    googleBtn.addEventListener('click', () => {
        const url = generateGoogleCalendarURL(
            eventData.title,
            eventData.start,
            eventData.end,
            eventData.desc,
            eventData.tz
        );
        if (url) {
            window.open(url, '_blank');
        }
    });

    // Apple/iOS/Other Calendar Button (ICS Download)
    const appleBtn = document.getElementById('appleBtn');
    appleBtn.addEventListener('click', () => {
        const icsContent = generateICSFile(
            eventData.title,
            eventData.start,
            eventData.end,
            eventData.desc,
            eventData.tz
        );
        if (icsContent) {
            downloadICSFile(icsContent);
        }
    });

    // Outlook Calendar Button
    const outlookBtn = document.getElementById('outlookBtn');
    outlookBtn.addEventListener('click', () => {
        const url = generateOutlookCalendarURL(
            eventData.title,
            eventData.start,
            eventData.end,
            eventData.desc
        );
        if (url) {
            window.open(url, '_blank');
        }
    });
}

// ========================================
// Error Handling
// ========================================

function showError(message) {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <div class="error-message">
            <h2>Oops! Something went wrong</h2>
            <p>${message}</p>
            <p style="margin-top: 12px; font-size: 14px;">Please check the invite link and try again.</p>
        </div>
    `;
}

// ========================================
// Initialize Page
// ========================================

function init() {
    try {
        const eventData = getURLParameters();

        // Validate required parameters
        if (!eventData.start || !eventData.end) {
            showError('This invite link is missing required event information.');
            return;
        }

        // Display event information
        displayEventInfo(eventData);

        // Setup calendar buttons
        setupCalendarButtons(eventData);
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('Failed to load event information.');
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
