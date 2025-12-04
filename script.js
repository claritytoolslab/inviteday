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
// Localization
// ========================================

const translations = {
    fi: {
        welcome: "Tervetuloa",
        loading: "Ladataan...",
        calendar_helper_text: "Lisää tämä kalenteriisi ja tarkista oletko vapaa.",
        rsvp_title: "Tuletko mukaan?",
        responding_as: "Vastaat nimellä:",
        name_placeholder: "Nimesi",
        show_name_checkbox: "Näytä nimeni muille osallistujille",
        privacy_text_prefix: "RSVP-nappia napauttamalla hyväksyt",
        privacy_policy: "Tietosuojakäytännön",
        data_practices: "Tietokäytännöt",
        validation_message: "Syötä ensin nimesi",
        rsvp_yes: "Kyllä",
        rsvp_later: "Ehkä",
        rsvp_no: "En",
        add_to_google: "Lisää Google-kalenteriin",
        add_to_apple: "Lisää Apple / iOS / Muu",
        add_to_outlook: "Lisää Outlookiin",
        guests_so_far: "Vieraat tähän mennessä",
        loading_responses: "Ladataan vastauksia...",
        details: "Tiedot",
        invite_created: "Tehty InviteDayllä",
        update_response: "Päivitä vastauksesi",
        rsvp_success: "Kiitos {name}! Vastauksesi on tallennettu.",
        be_first_to_respond: "Ole ensimmäinen vastaaja!",
        error_load_responses: "Vastausten lataaminen epäonnistui",
        error_title: "Hups! Jotain meni pieleen",
        error_missing_info: "Tästä kutsulinkistä puuttuu tapahtuman tiedot.",
        error_failed_to_load: "Tapahtuman tietojen lataaminen epäonnistui."
    },
    en: {
        welcome: "Welcome",
        loading: "Loading...",
        calendar_helper_text: "Add this to your calendar and check if you're free.",
        rsvp_title: "Will you join?",
        responding_as: "Responding as:",
        name_placeholder: "Your name",
        show_name_checkbox: "Show my name to other attendees",
        privacy_text_prefix: "By tapping RSVP you agree to our",
        privacy_policy: "Privacy Policy",
        data_practices: "Data Practices",
        validation_message: "Please enter your name first",
        rsvp_yes: "Yes",
        rsvp_later: "Later",
        rsvp_no: "No",
        add_to_google: "Add to Google Calendar",
        add_to_apple: "Add to Apple / iOS / Other",
        add_to_outlook: "Add to Outlook",
        guests_so_far: "Guests so far",
        loading_responses: "Loading responses...",
        details: "Details",
        invite_created: "Invite created with InviteDay",
        update_response: "Update your response",
        rsvp_success: "Thanks {name}! Your response has been recorded.",
        be_first_to_respond: "Be the first to respond!",
        error_load_responses: "Failed to load responses",
        error_title: "Oops! Something went wrong",
        error_missing_info: "This invite link is missing required event information.",
        error_failed_to_load: "Failed to load event information."
    },
    es: {
        welcome: "Bienvenido",
        loading: "Cargando...",
        calendar_helper_text: "Agrega esto a tu calendario y verifica si estás libre.",
        rsvp_title: "¿Vendrás?",
        responding_as: "Respondiendo como:",
        name_placeholder: "Tu nombre",
        show_name_checkbox: "Mostrar mi nombre a otros asistentes",
        privacy_text_prefix: "Al tocar RSVP aceptas nuestra",
        privacy_policy: "Política de Privacidad",
        data_practices: "Prácticas de Datos",
        validation_message: "Por favor ingresa tu nombre primero",
        rsvp_yes: "Sí",
        rsvp_later: "Más Tarde",
        rsvp_no: "No",
        add_to_google: "Agregar a Google Calendar",
        add_to_apple: "Agregar a Apple / iOS / Otro",
        add_to_outlook: "Agregar a Outlook",
        guests_so_far: "Invitados hasta ahora",
        loading_responses: "Cargando respuestas...",
        details: "Detalles",
        invite_created: "Invitación creada con InviteDay",
        update_response: "Actualiza tu respuesta",
        rsvp_success: "¡Gracias {name}! Tu respuesta ha sido registrada.",
        be_first_to_respond: "¡Sé el primero en responder!",
        error_load_responses: "Error al cargar respuestas",
        error_title: "¡Ups! Algo salió mal",
        error_missing_info: "Este enlace de invitación no tiene la información del evento requerida.",
        error_failed_to_load: "Error al cargar la información del evento."
    },
    de: {
        welcome: "Willkommen",
        loading: "Lädt...",
        calendar_helper_text: "Füge dies zu deinem Kalender hinzu und prüfe, ob du frei bist.",
        rsvp_title: "Kommst du?",
        responding_as: "Antworte als:",
        name_placeholder: "Dein Name",
        show_name_checkbox: "Meinen Namen anderen Teilnehmern zeigen",
        privacy_text_prefix: "Durch Tippen auf RSVP stimmst du unserer",
        privacy_policy: "Datenschutzrichtlinie",
        data_practices: "Datenpraktiken",
        validation_message: "Bitte gib zuerst deinen Namen ein",
        rsvp_yes: "Ja",
        rsvp_later: "Später",
        rsvp_no: "Nein",
        add_to_google: "Zu Google Kalender hinzufügen",
        add_to_apple: "Zu Apple / iOS / Andere hinzufügen",
        add_to_outlook: "Zu Outlook hinzufügen",
        guests_so_far: "Gäste bisher",
        loading_responses: "Lade Antworten...",
        details: "Details",
        invite_created: "Einladung erstellt mit InviteDay",
        update_response: "Aktualisiere deine Antwort",
        rsvp_success: "Danke {name}! Deine Antwort wurde gespeichert.",
        be_first_to_respond: "Sei der Erste, der antwortet!",
        error_load_responses: "Antworten konnten nicht geladen werden",
        error_title: "Hoppla! Etwas ist schief gelaufen",
        error_missing_info: "Dieser Einladungslink enthält nicht die erforderlichen Event-Informationen.",
        error_failed_to_load: "Event-Informationen konnten nicht geladen werden."
    },
    fr: {
        welcome: "Bienvenue",
        loading: "Chargement...",
        calendar_helper_text: "Ajoutez ceci à votre calendrier et vérifiez si vous êtes libre.",
        rsvp_title: "Viendrez-vous ?",
        responding_as: "Répondre en tant que :",
        name_placeholder: "Votre nom",
        show_name_checkbox: "Afficher mon nom aux autres participants",
        privacy_text_prefix: "En appuyant sur RSVP, vous acceptez notre",
        privacy_policy: "Politique de Confidentialité",
        data_practices: "Pratiques de Données",
        validation_message: "Veuillez d'abord entrer votre nom",
        rsvp_yes: "Oui",
        rsvp_later: "Plus Tard",
        rsvp_no: "Non",
        add_to_google: "Ajouter à Google Agenda",
        add_to_apple: "Ajouter à Apple / iOS / Autre",
        add_to_outlook: "Ajouter à Outlook",
        guests_so_far: "Invités jusqu'à présent",
        loading_responses: "Chargement des réponses...",
        details: "Détails",
        invite_created: "Invitation créée avec InviteDay",
        update_response: "Mettez à jour votre réponse",
        rsvp_success: "Merci {name} ! Votre réponse a été enregistrée.",
        be_first_to_respond: "Soyez le premier à répondre !",
        error_load_responses: "Échec du chargement des réponses",
        error_title: "Oups ! Quelque chose s'est mal passé",
        error_missing_info: "Ce lien d'invitation ne contient pas les informations d'événement requises.",
        error_failed_to_load: "Échec du chargement des informations de l'événement."
    },
    sv: {
        welcome: "Välkommen",
        loading: "Laddar...",
        calendar_helper_text: "Lägg till i din kalender och kolla om du är ledig.",
        rsvp_title: "Kommer du?",
        responding_as: "Svarar som:",
        name_placeholder: "Ditt namn",
        show_name_checkbox: "Visa mitt namn för andra deltagare",
        privacy_text_prefix: "Genom att trycka på RSVP godkänner du vår",
        privacy_policy: "Integritetspolicy",
        data_practices: "Datapraxis",
        validation_message: "Vänligen ange ditt namn först",
        rsvp_yes: "Ja",
        rsvp_later: "Senare",
        rsvp_no: "Nej",
        add_to_google: "Lägg till i Google Kalender",
        add_to_apple: "Lägg till i Apple / iOS / Annat",
        add_to_outlook: "Lägg till i Outlook",
        guests_so_far: "Gäster hittills",
        loading_responses: "Laddar svar...",
        details: "Detaljer",
        invite_created: "Skapad med InviteDay",
        update_response: "Uppdatera ditt svar",
        rsvp_success: "Tack {name}! Ditt svar har registrerats.",
        be_first_to_respond: "Var först att svara!",
        error_load_responses: "Kunde inte ladda svar",
        error_title: "Hoppsan! Något gick fel",
        error_missing_info: "Denna inbjudningslänk saknar nödvändig eventinformation.",
        error_failed_to_load: "Kunde inte ladda eventinformation."
    },
    ja: {
        welcome: "ようこそ",
        loading: "読み込み中...",
        calendar_helper_text: "これをカレンダーに追加して、予定が空いているか確認してください。",
        rsvp_title: "参加しますか？",
        responding_as: "返信者：",
        name_placeholder: "お名前",
        show_name_checkbox: "他の参加者に名前を表示する",
        privacy_text_prefix: "RSVPをタップすることで",
        privacy_policy: "プライバシーポリシー",
        data_practices: "データ取り扱い",
        validation_message: "まず名前を入力してください",
        rsvp_yes: "はい",
        rsvp_later: "後で",
        rsvp_no: "いいえ",
        add_to_google: "Googleカレンダーに追加",
        add_to_apple: "Apple / iOS / その他に追加",
        add_to_outlook: "Outlookに追加",
        guests_so_far: "これまでのゲスト",
        loading_responses: "返信を読み込み中...",
        details: "詳細",
        invite_created: "InviteDayで作成された招待状",
        update_response: "返信を更新",
        rsvp_success: "ありがとうございます、{name}さん！返信を記録しました。",
        be_first_to_respond: "最初の返信者になりましょう！",
        error_load_responses: "返信の読み込みに失敗しました",
        error_title: "エラーが発生しました",
        error_missing_info: "この招待リンクには必要なイベント情報がありません。",
        error_failed_to_load: "イベント情報の読み込みに失敗しました。"
    }
};

// Get language from URL parameter, fallback to English
let currentLanguage = 'en';
function getLanguage() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    // Validate language exists in translations
    if (lang && translations[lang]) {
        return lang;
    }
    return 'en'; // Default to English for backward compatibility
}

// Translation function
function t(key) {
    const lang = translations[currentLanguage];
    return lang && lang[key] ? lang[key] : translations.en[key] || key;
}

// Initialize language
currentLanguage = getLanguage();

// Initialize all static translations
function initializeTranslations() {
    // Update HTML lang attribute
    document.documentElement.lang = currentLanguage;

    // Welcome section
    const welcomeText = document.getElementById('welcomeText');
    if (welcomeText) welcomeText.textContent = t('welcome');

    // Helper text
    const helperText = document.getElementById('helperText');
    if (helperText) helperText.textContent = t('calendar_helper_text');

    // RSVP section
    const rsvpTitle = document.getElementById('rsvpTitle');
    if (rsvpTitle) rsvpTitle.textContent = t('rsvp_title');

    const respondingLabel = document.getElementById('respondingLabel');
    if (respondingLabel) respondingLabel.textContent = t('responding_as');

    const attendeeName = document.getElementById('attendeeName');
    if (attendeeName) attendeeName.placeholder = t('name_placeholder');

    // Update both checkbox labels (one for first-time, one for returning users)
    const showNameCheckboxLabel = document.getElementById('showNameCheckboxLabel');
    if (showNameCheckboxLabel) showNameCheckboxLabel.textContent = t('show_name_checkbox');

    const showNameCheckboxLabelFirstTime = document.getElementById('showNameCheckboxLabelFirstTime');
    if (showNameCheckboxLabelFirstTime) showNameCheckboxLabelFirstTime.textContent = t('show_name_checkbox');

    // Privacy text - need to reconstruct with links
    const privacyText = document.getElementById('privacyText');
    if (privacyText) {
        privacyText.innerHTML = `${t('privacy_text_prefix')}
            <a href="privacy.html" style="color: #A87CBF; text-decoration: none;">${t('privacy_policy')}</a> ${t('data_practices').toLowerCase().includes('and') ? '' : 'and'}
            <a href="terms.html" style="color: #A87CBF; text-decoration: none;">${t('data_practices')}</a>.`;
    }

    const validationMessage = document.getElementById('validationMessage');
    if (validationMessage) validationMessage.textContent = t('validation_message');

    // RSVP buttons
    const rsvpYesText = document.getElementById('rsvpYesText');
    if (rsvpYesText) rsvpYesText.textContent = t('rsvp_yes');

    const rsvpLaterText = document.getElementById('rsvpLaterText');
    if (rsvpLaterText) rsvpLaterText.textContent = t('rsvp_later');

    const rsvpNoText = document.getElementById('rsvpNoText');
    if (rsvpNoText) rsvpNoText.textContent = t('rsvp_no');

    // Calendar buttons
    const googleBtnText = document.getElementById('googleBtnText');
    if (googleBtnText) googleBtnText.textContent = t('add_to_google');

    const appleBtnText = document.getElementById('appleBtnText');
    if (appleBtnText) appleBtnText.textContent = t('add_to_apple');

    const outlookBtnText = document.getElementById('outlookBtnText');
    if (outlookBtnText) outlookBtnText.textContent = t('add_to_outlook');

    // Responses section
    const guestsSoFarTitle = document.getElementById('guestsSoFarTitle');
    if (guestsSoFarTitle) guestsSoFarTitle.textContent = t('guests_so_far');

    const loadingResponsesText = document.getElementById('loadingResponsesText');
    if (loadingResponsesText) loadingResponsesText.textContent = t('loading_responses');

    // Details section
    const detailsTitle = document.getElementById('detailsTitle');
    if (detailsTitle) detailsTitle.textContent = t('details');

    // Footer
    const footerText = document.getElementById('footerText');
    if (footerText) footerText.textContent = t('invite_created');
}

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
        location: safeDecodeParam(params.get('location')) || '',
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

// Helper to get browser locale from language code
function getLocaleFromLanguage(lang) {
    const localeMap = {
        'en': 'en-US',
        'fi': 'fi-FI',
        'sv': 'sv-SE',
        'de': 'de-DE',
        'fr': 'fr-FR',
        'es': 'es-ES',
        'ja': 'ja-JP'
    };
    return localeMap[lang] || 'en-US';
}

function formatEventDateTime(startISO, endISO, timezone) {
    try {
        const startDate = parseISODate(startISO);
        const endDate = parseISODate(endISO);

        if (!startDate || !endDate) {
            throw new Error('Failed to parse dates');
        }

        // Check if event spans multiple days
        const locale = getLocaleFromLanguage(currentLanguage);
        const startDay = new Date(startDate.toLocaleString(locale, { timeZone: timezone })).toDateString();
        const endDay = new Date(endDate.toLocaleString(locale, { timeZone: timezone })).toDateString();
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
            const formattedStartDate = startDate.toLocaleDateString(locale, dateOptions);
            const formattedEndDate = endDate.toLocaleDateString(locale, dateOptions);
            const formattedDate = `${formattedStartDate} – ${formattedEndDate}`;

            // Time: "3:00 PM – 5:00 PM"
            const startTime = startDate.toLocaleTimeString(locale, timeOptions);
            const endTime = endDate.toLocaleTimeString(locale, timeOptions);
            const formattedTime = `${startTime} – ${endTime}`;

            return { date: formattedDate, time: formattedTime };
        } else {
            // Single-day event: "Monday, November 23, 2025"
            const formattedDate = startDate.toLocaleDateString(locale, dateOptions);

            // Time: "3:00 PM – 5:00 PM"
            const startTime = startDate.toLocaleTimeString(locale, timeOptions);
            const endTime = endDate.toLocaleTimeString(locale, timeOptions);
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

    // Display location if available
    if (eventData.location) {
        const locationEl = document.getElementById('eventLocation');
        locationEl.textContent = '📍 ' + eventData.location;
        locationEl.style.display = 'block';
    }

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

function getStoredShowName(eventId) {
    const stored = localStorage.getItem(`rsvp_showName_${eventId}`);
    // Default to true if not set
    return stored === null ? true : stored === 'true';
}

function storeName(eventId, name) {
    localStorage.setItem(`rsvp_name_${eventId}`, name);
}

function storeShowName(eventId, showName) {
    localStorage.setItem(`rsvp_showName_${eventId}`, showName.toString());
}

function clearStoredName(eventId) {
    localStorage.removeItem(`rsvp_name_${eventId}`);
    localStorage.removeItem(`rsvp_showName_${eventId}`);
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

    // Restore checkbox state from localStorage
    const savedShowName = getStoredShowName(eventId);
    const checkbox = document.getElementById('showNameCheckbox');
    if (checkbox) {
        checkbox.checked = savedShowName;
    }

    // Update RSVP title
    document.querySelector('.rsvp-title').textContent = t('update_response');

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
    document.querySelector('.rsvp-title').textContent = t('rsvp_title');

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
            <h2>${t('error_title')}</h2>
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
    let showNameCheckbox;

    if (window.currentRSVPName) {
        // User has already RSVP'd - use stored name and returning user checkbox
        attendeeName = window.currentRSVPName;
        showNameCheckbox = document.getElementById('showNameCheckbox');
    } else {
        // First time RSVP - validate input and use first-time checkbox
        attendeeName = nameInput.value.trim();
        if (!attendeeName) {
            validationMessage.style.display = 'block';
            nameInput.focus();
            return;
        }
        validationMessage.style.display = 'none';
        showNameCheckbox = document.getElementById('showNameCheckboxInputFirstTime');
    }

    try {
        // Submit RSVP via Edge Function (encrypts name)
        const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-rsvp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                eventId: eventId,
                attendeeName: attendeeName,
                status: status,
                showName: showNameCheckbox ? showNameCheckbox.checked : true
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to submit RSVP');
        }

        // Store name and showName preference in localStorage for future visits
        storeName(eventId, attendeeName);
        storeShowName(eventId, showNameCheckbox ? showNameCheckbox.checked : true);

        // Clear input and show success
        nameInput.value = '';

        // Switch to "responding as" mode
        showRespondingAsMode(eventId, attendeeName);

        // Reload responses
        await loadResponses(eventId);

        // Show brief success message
        const successMsg = document.createElement('p');
        successMsg.className = 'success-message';
        successMsg.textContent = t('rsvp_success').replace('{name}', attendeeName);
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
            .select('attendee_name, status, created_at, show_name')
            .eq('event_id', eventId)
            .eq('show_name', true)  // Only show responses where user opted in
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            responsesList.innerHTML = `<p class="no-responses">${t('be_first_to_respond')}</p>`;
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
        responsesList.innerHTML = `<p class="error-text">${t('error_load_responses')}</p>`;
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

    // Load existing responses
    loadResponses(eventId);
}

// ========================================
// Initialize Page
// ========================================

function init() {
    try {
        // Initialize translations first
        initializeTranslations();

        const eventData = getURLParameters();

        if (!eventData.start || !eventData.end) {
            showError(t('error_missing_info'));
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
        showError(t('error_failed_to_load'));
    }
}

document.addEventListener('DOMContentLoaded', init);
