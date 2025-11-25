/**
 * InviteDay - Event Page Script
 * Handles URL parsing, event display, and calendar integration
 */

// ========================================
// Configuration
// ========================================

// Cloudflare Worker endpoint for ICS generation
const ICS_WORKER_HOST = 'inviteday-ics.claritytoolslab.workers.dev';

// Supabase configuration
const SUPABASE_URL = 'https://ccvidczwyklvmhwqopeu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdmlkY3p3eWtsdm1od3FvcGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjI1OTEsImV4cCI6MjA3OTU5ODU5MX0.KE3zPe1zHtbVL8EJhHHTKJ6c9zdM8yMXhwd-dLhA2MI';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========================================
// Parse URL Parameters
// ========================================

function getURLParameters() {
    const params = new URLSearchParams(window.location.search);

    // Helper to safely decode UTF-8 strings (handles Finnish ä, ö, etc.)
    const safeDecodeParam = (value) => {
        if (!value) return '';
        try {
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

    // Helper to fix ISO date strings where + became space
    const fixISODate = (value) => {
        if (!value) return null;
        // URL decoding converts + to space, but we need + for timezone offset
        // Pattern: "2025-11-23T21:16:00 02:00" should be "2025-11-23T21:16:00+02:00"
        return value.replace(/(\d{2}:\d{2}:\d{2})\s(\d{2}:\d{2})$/, '$1+$2');
    };

    return {
        title: safeDecodeParam(params.get('title')) || 'Untitled Event',
        start: fixISODate(params.get('start')),
        end: fixISODate(params.get('end')),
        tz: params.get('tz') || 'UTC',
        desc: safeDecodeParam(params.get('desc')) || '',
        img: params.get('img') || '',
        eventId: params.get('eventId') || null,
        rsvp: params.get('rsvp') === '1'
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

        // Check if event spans multiple days
        const startDay = new Date(startDate.toLocaleString('en-US', { timeZone: timezone })).toDateString();
        const endDay = new Date(endDate.toLocaleString('en-US', { timeZone: timezone })).toDateString();
        const isMultiDay = startDay !== endDay;

        const dateOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: timezone
        };

        const timeOptions = {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: timezone
        };

        if (isMultiDay) {
            // Multi-day event: "Monday, November 23, 2025 – Tuesday, November 24, 2025"
            const formattedStartDate = startDate.toLocaleDateString('en-US', dateOptions);
            const formattedEndDate = endDate.toLocaleDateString('en-US', dateOptions);
            const formattedDate = `${formattedStartDate} – ${formattedEndDate}`;

            // Time: "3:00 PM – 5:00 PM"
            const startTime = startDate.toLocaleTimeString('en-US', timeOptions);
            const endTime = endDate.toLocaleTimeString('en-US', timeOptions);
            const formattedTime = `${startTime} – ${endTime}`;

            return { date: formattedDate, time: formattedTime };
        } else {
            // Single-day event: "Monday, November 23, 2025"
            const formattedDate = startDate.toLocaleDateString('en-US', dateOptions);

            // Time: "3:00 PM – 5:00 PM"
            const startTime = startDate.toLocaleTimeString('en-US', timeOptions);
            const endTime = endDate.toLocaleTimeString('en-US', timeOptions);
            const formattedTime = `${startTime} – ${endTime}`;

            return { date: formattedDate, time: formattedTime };
        }
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
    // Manually encode to ensure + in timezone offset becomes %2B
    const params = new URLSearchParams({
        title: title,
        start: startISO,
        end: endISO,
        desc: description,
        tz: timezone
    });

    // URLSearchParams doesn't encode +, but we need %2B for timezone offsets
    // Replace + with %2B in the final string
    const queryString = params.toString().replace(/\+/g, '%2B');

    // webcal:// protocol triggers native calendar app on all platforms
    return `webcal://${ICS_WORKER_HOST}/?${queryString}`;
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
// LocalStorage for RSVP tracking
// ========================================

function getStoredName(eventId) {
    return localStorage.getItem(`rsvp_name_${eventId}`);
}

function storeName(eventId, name) {
    localStorage.setItem(`rsvp_name_${eventId}`, name);
}

function clearStoredName(eventId) {
    localStorage.removeItem(`rsvp_name_${eventId}`);
}

// ========================================
// RSVP UI Mode Management
// ========================================

function showRespondingAsMode(eventId, name) {
    // Hide name input and validation message
    document.getElementById('attendeeName').style.display = 'none';
    document.getElementById('validationMessage').style.display = 'none';

    // Show "responding as" message
    const respondingAsDiv = document.getElementById('respondingAs');
    respondingAsDiv.style.display = 'block';
    respondingAsDiv.querySelector('.responding-name').textContent = name;

    // Update RSVP title
    document.querySelector('.rsvp-title').textContent = 'Update your response';

    // Store the current name for button handlers
    window.currentRSVPName = name;
}

function showNameInputMode() {
    // Show name input
    document.getElementById('attendeeName').style.display = 'block';

    // Hide "responding as" message
    const respondingAsDiv = document.getElementById('respondingAs');
    if (respondingAsDiv) {
        respondingAsDiv.style.display = 'none';
    }

    // Reset RSVP title
    document.querySelector('.rsvp-title').textContent = 'Will you join?';

    // Clear stored name
    window.currentRSVPName = null;
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
// RSVP Functions
// ========================================

async function submitRSVP(eventId, status) {
    const nameInput = document.getElementById('attendeeName');
    const validationMessage = document.getElementById('validationMessage');

    // Get attendee name from either stored name or input field
    let attendeeName;
    if (window.currentRSVPName) {
        // User has already RSVP'd - use stored name
        attendeeName = window.currentRSVPName;
    } else {
        // First time RSVP - validate input
        attendeeName = nameInput.value.trim();
        if (!attendeeName) {
            validationMessage.style.display = 'block';
            nameInput.focus();
            return;
        }
        validationMessage.style.display = 'none';
    }

    try {
        // Upsert response (update if exists, insert if new)
        const { error } = await supabase
            .from('responses')
            .upsert({
                event_id: eventId,
                attendee_name: attendeeName,
                status: status
            }, {
                onConflict: 'event_id,attendee_name'
            });

        if (error) throw error;

        // Store name in localStorage for future visits (prevents spam)
        storeName(eventId, attendeeName);

        // Clear input and show success
        nameInput.value = '';

        // Switch to "responding as" mode
        showRespondingAsMode(eventId, attendeeName);

        // Reload responses
        await loadResponses(eventId);

        // Show brief success message
        const successMsg = document.createElement('p');
        successMsg.className = 'success-message';
        successMsg.textContent = `Thanks ${attendeeName}! Your response has been recorded.`;
        document.getElementById('rsvpSection').appendChild(successMsg);

        setTimeout(() => successMsg.remove(), 3000);
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        alert('Failed to submit response. Please try again.');
    }
}

async function loadResponses(eventId) {
    const responsesList = document.getElementById('responsesList');

    try {
        const { data, error } = await supabase
            .from('responses')
            .select('attendee_name, status, created_at')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            responsesList.innerHTML = '<p class="no-responses">Be the first to respond!</p>';
            return;
        }

        // Group responses by status
        const statusIcon = {
            'yes': '<span class="status-icon status-yes">✓</span>',
            'no': '<span class="status-icon status-no">✕</span>',
            'later': '<span class="status-icon status-later">?</span>'
        };

        const statusLabel = {
            'yes': 'Yes',
            'no': 'No',
            'later': 'Later'
        };

        // Render responses
        responsesList.innerHTML = data.map(response => `
            <div class="response-item">
                ${statusIcon[response.status] || ''}
                <span class="response-name">${response.attendee_name}</span>
                <span class="response-status">${statusLabel[response.status] || response.status}</span>
            </div>
        `).join('');

        // Show responses section
        document.getElementById('responsesSection').style.display = 'block';
    } catch (error) {
        console.error('Error loading responses:', error);
        responsesList.innerHTML = '<p class="error-text">Failed to load responses</p>';
    }
}

function setupRSVP(eventId) {
    // Show RSVP section
    document.getElementById('rsvpSection').style.display = 'block';

    // Check if user has already RSVP'd for this event (spam prevention)
    const storedName = getStoredName(eventId);
    if (storedName) {
        // User has already RSVP'd - show "responding as" mode
        showRespondingAsMode(eventId, storedName);
    } else {
        // First time - show normal input mode
        showNameInputMode();
    }

    // Setup RSVP button handlers
    document.getElementById('rsvpYes').addEventListener('click', () => submitRSVP(eventId, 'yes'));
    document.getElementById('rsvpMaybe').addEventListener('click', () => submitRSVP(eventId, 'later'));
    document.getElementById('rsvpNo').addEventListener('click', () => submitRSVP(eventId, 'no'));

    // Setup "Change name" button handler (if it exists)
    const changeNameBtn = document.getElementById('changeNameBtn');
    if (changeNameBtn) {
        changeNameBtn.addEventListener('click', () => {
            // Clear stored name for this event
            clearStoredName(eventId);
            // Reset UI to show input mode
            showNameInputMode();
        });
    }

    // Load existing responses
    loadResponses(eventId);
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

        // Setup RSVP if enabled
        if (eventData.rsvp && eventData.eventId) {
            setupRSVP(eventData.eventId);
        }
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('Failed to load event information.');
    }
}

document.addEventListener('DOMContentLoaded', init);
