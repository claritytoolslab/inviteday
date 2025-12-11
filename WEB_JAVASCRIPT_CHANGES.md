# JavaScript Changes for Event Invite Features

## Muutokset script.js-tiedostoon

### 1. Lisää käännökset (noin riville 24-160)

Lisää JOKAISEEN kieleen seuraavat rivit:

```javascript
// Suomeksi (fi):
dietary_label: "Ruoka-allergiat tai -rajoitteet",
dietary_placeholder: "Esim. kasvis, gluteeniton...",
plus_one_label: "Tuotko seuralaisen?",
plus_one_yes: "Kyllä, tuon vieraan",
plus_one_no: "Ei, tulen yksin",
plus_one_name_placeholder: "Vieraan nimi",

// Englanniksi (en):
dietary_label: "Dietary restrictions or allergies",
dietary_placeholder: "Vegetarian, gluten-free, etc.",
plus_one_label: "Are you bringing someone?",
plus_one_yes: "Yes, bringing a guest",
plus_one_no: "No, just me",
plus_one_name_placeholder: "Name of your guest",

// Espanjaksi (es):
dietary_label: "Restricciones dietéticas o alergias",
dietary_placeholder: "Vegetariano, sin gluten, etc.",
plus_one_label: "¿Traes a alguien?",
plus_one_yes: "Sí, traigo un invitado",
plus_one_no: "No, solo yo",
plus_one_name_placeholder: "Nombre del invitado",

// Saksaksi (de):
dietary_label: "Ernährungseinschränkungen oder Allergien",
dietary_placeholder: "Vegetarisch, glutenfrei, usw.",
plus_one_label: "Bringst du jemanden mit?",
plus_one_yes: "Ja, ich bringe einen Gast mit",
plus_one_no: "Nein, nur ich",
plus_one_name_placeholder: "Name des Gastes",

// Ranskaksi (fr):
dietary_label: "Allergies ou régimes alimentaires",
dietary_placeholder: "Végétarien, sans gluten, etc.",
plus_one_label: "Venez-vous avec quelqu'un?",
plus_one_yes: "Oui, j'amène quelqu'un",
plus_one_no: "Non, seul(e)",
plus_one_name_placeholder: "Nom de votre invité(e)",
```

### 2. Lisää funktio invite-datan hakemiseen

Lisää uusi funktio (esim. rivin 700 jälkeen):

```javascript
// ========================================
// Snap2Plan Invite Integration
// ========================================

async function loadSnap2PlanInvite(inviteId) {
    try {
        console.log('Loading Snap2Plan invite:', inviteId);

        // Käytä Supabasea suoraan (Edge Function URL)
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/event-invite-handler/invite/${inviteId}`,
            {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error('Failed to load invite:', response.status);
            return null;
        }

        const invite = await response.json();
        console.log('Invite loaded:', invite);

        // Show dietary field if enabled
        if (invite.ask_dietary_restrictions) {
            document.getElementById('dietaryField').style.display = 'block';
        }

        // Show plus-one field if enabled
        if (invite.ask_plus_one) {
            document.getElementById('plusOneField').style.display = 'block';

            // Toggle plus-one name field
            document.getElementById('plusOneYes').addEventListener('change', () => {
                document.getElementById('plusOneName').style.display = 'block';
            });
            document.getElementById('plusOneNo').addEventListener('change', () => {
                document.getElementById('plusOneName').style.display = 'none';
                document.getElementById('plusOneName').value = '';
            });
        }

        return invite;

    } catch (error) {
        console.error('Error loading Snap2Plan invite:', error);
        return null;
    }
}

async function submitSnap2PlanResponse(inviteId, guestName, showName, response) {
    try {
        // Collect optional fields
        const dietary = document.getElementById('dietaryInput').value.trim() || null;
        const hasPlusOne = document.getElementById('plusOneYes')?.checked || false;
        const plusOneName = hasPlusOne ?
            document.getElementById('plusOneName').value.trim() || null : null;

        const payload = {
            invite_id: inviteId,
            guest_name: guestName,
            show_name_to_others: showName,
            response: response, // 'yes', 'maybe', 'no'
            dietary_restrictions: dietary,
            has_plus_one: hasPlusOne,
            plus_one_name: plusOneName
        };

        console.log('Submitting Snap2Plan response:', payload);

        const apiResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/event-invite-handler/response`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );

        if (!apiResponse.ok) {
            console.error('Failed to submit response:', apiResponse.status);
            return false;
        }

        const result = await apiResponse.json();
        console.log('Response submitted successfully:', result);
        return true;

    } catch (error) {
        console.error('Error submitting Snap2Plan response:', error);
        return false;
    }
}
```

### 3. Päivitä initializePage()-funktio

Etsi `initializePage()` funktio ja lisää tuki `invite` URL-parametrille:

```javascript
// URL parameters
const urlParams = new URLSearchParams(window.location.search);
const inviteParam = urlParams.get('invite'); // Snap2Plan invite ID

// ... existing code ...

// Jos on invite-parametri, lataa Snap2Plan invite-data
if (inviteParam && rsvpEnabled) {
    await loadSnap2PlanInvite(inviteParam);
}
```

### 4. Päivitä RSVP-submit funktio

Etsi RSVP-nappien event handlerit ja lisää Snap2Plan-tuki:

```javascript
// Esim. rsvpYes.addEventListener('click', async () => { ... })
// Lisää ennen responseData.insertia:

if (inviteParam) {
    await submitSnap2PlanResponse(inviteParam, attendeeName, showName, 'yes');
}
```

Vastaavasti `rsvpMaybe` → `'maybe'` ja `rsvpNo` → `'no'`

### 5. Päivitä applyTranslations()-funktio

Lisää uudet käännökset:

```javascript
function applyTranslations(lang) {
    // ... existing translations ...

    // New translations for dietary & plus-one
    if (document.getElementById('dietaryLabel')) {
        document.getElementById('dietaryLabel').textContent = t.dietary_label;
    }
    if (document.getElementById('dietaryInput')) {
        document.getElementById('dietaryInput').placeholder = t.dietary_placeholder;
    }
    if (document.getElementById('plusOneLabel')) {
        document.getElementById('plusOneLabel').textContent = t.plus_one_label;
    }
    if (document.getElementById('plusOneYesLabel')) {
        document.getElementById('plusOneYesLabel').textContent = t.plus_one_yes;
    }
    if (document.getElementById('plusOneNoLabel')) {
        document.getElementById('plusOneNoLabel').textContent = t.plus_one_no;
    }
    if (document.getElementById('plusOneName')) {
        document.getElementById('plusOneName').placeholder = t.plus_one_name_placeholder;
    }
}
```

## Yhteenveto

1. **HTML**: Lisää 2 uutta kenttää (dietary & plus-one)
2. **CSS**: Lisää tyylit kentille
3. **JS**: Lisää käännökset (6 kieltä), API-funktiot, integrointi olemassa olevaan RSVP-logiikkaan

Kaikki muutokset on dokumentoitu tarkasti - sinä voit pushata ne Githubiin!
