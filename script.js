/**
 * InviteDay - Event Page Script
 * Handles URL parsing, event display, and calendar integration
 */

// ========================================
// Configuration
// ========================================

// Cloudflare Worker endpoint for ICS generation
// UPDATE THIS after deploying your worker!
const ICS_WORKER_HOST = 'inviteday-ics.claritytoolslab.workers.dev';

// ========================================
// Parse URL Parameters
// ========================================

function getURLParameters() {
    const params = new URLSearchParams(window.location.search);

    // Helper to safely decode UTF-8 strings (handles Finnish ä, ö, etc.)
    const safeDecodeParam = (value) => {
        if (!value) return '';
        try {
            // Double-decode in case of double encoding
            let decoded = value;
            try {
                decoded = decodeURIComponent(value.replace(/\+/g, ' '));
            } catch (e) {
                // Already decoded or invalid
            }
            return decoded;
        } catch (e) {
            return value;
        }
    };

    return {
        title: safeDecodeParam(params.get('title')) || 'Untitled Event',
        start: params.get('start'),
        end: params.get('end'),
        tz: params.get('tz') || 'UTC',
        desc: safeDecodeParam(params.get('desc')) || '',
        img: params.get('img') || ''
    };
}

// ========================================
// Robust ISO Date Parsing (Safari compatible)
// ========================================

function parseISODate(isoString) {
    if (!isoString) return null;

    // Try native parsing first
    let date = new Date(isoString);
    if (!isNaN(date.getTime())) {
        return date;
    }

    // Manual parsing for Safari/iOS compatibility
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

        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: timezone
        };
        const formattedDate = startDate.toLocaleDateString('en-US', dateOptions);

        const timeOptions = {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: timezone
        };
        const startTime = startDate.toLocaleTimeString('en-US', timeOptions);
        const endTime = endDate.toLocaleTimeString('en-US', timeOptions);
        const formattedTime = `${startTime} – ${endTime}`;

        return { date: formattedDate, time: formattedTime };
    } catch (error) {
        console.error('Error formatting date/time:', error);
        return { date: 'Date unavailable', time: 'Time unavailable' };
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

        const formatDateForGoogle = (date) => {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
        };

        const dates = `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`;

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            dates: dates,
            details: description,
            ctz: timezone
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
        const params = new URLSearchParams({
            path: '/calendar/action/compose',
            rru: 'addevent',
            subject: title,
            startdt: startISO,
            enddt: endISO,
            body: description
        });

        return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
    } catch (error) {
        console.error('Error generating Outlook Calendar URL:', error);
        return null;
    }
}

// ========================================
// Webcal URL Generation (Apple/iOS/Other)
// ========================================

function generateWebcalURL(title, startISO, endISO, description, timezone) {
    const params = new URLSearchParams({
        title: title,
        start: startISO,
        end: endISO,
        desc: description,
        tz: timezone
    });

    // webcal:// protocol triggers native calendar app on all platforms
    return `webcal://${ICS_WORKER_HOST}/?${params.toString()}`;
}

// Fallback HTTPS URL for ICS download (desktop browsers)
function generateICSDownloadURL(title, startISO, endISO, description, timezone) {
    const params = new URLSearchParams({
        title: title,
        start: startISO,
        end: endISO,
        desc: description,
        tz: timezone
    });

    return `https://${ICS_WORKER_HOST}/?${params.toString()}`;
}

// ========================================
// Display Event Information
// ========================================

function displayEventInfo(eventData) {
    document.getElementById('eventTitle').textContent = eventData.title;

    const { date, time } = formatEventDateTime(eventData.start, eventData.end, eventData.tz);
    document.getElementById('eventDate').textContent = date;
    document.getElementById('eventTime').textContent = time;

    if (eventData.desc) {
        document.getElementById('descriptionText').textContent = eventData.desc;
        document.getElementById('descriptionSection').style.display = 'block';
    }

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

    // Apple/iOS/Other Calendar Button (webcal://)
    const appleBtn = document.getElementById('appleBtn');
    appleBtn.addEventListener('click', () => {
        const webcalUrl = generateWebcalURL(
            eventData.title,
            eventData.start,
            eventData.end,
            eventData.desc,
            eventData.tz
        );

        // webcal:// triggers native calendar app
        // This works on: iPhone, iPad, Android, Mac, Windows
        window.location.href = webcalUrl;
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

        if (!eventData.start || !eventData.end) {
            showError('This invite link is missing required event information.');
            return;
        }

        displayEventInfo(eventData);
        setupCalendarButtons(eventData);
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('Failed to load event information.');
    }
}

document.addEventListener('DOMContentLoaded', init);
