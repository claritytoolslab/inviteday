# Web Changes for Event Invite Features

## Muutokset tiedostoihin

### 1. index.html - Lisää uudet kentät RSVP-osioon

Lisää rivien 65-66 jälkeen (ennen `<p class="validation-message">`):

```html
<!-- Dietary Restrictions Field (conditional) -->
<div class="dietary-field" id="dietaryField" style="display: none;">
    <label class="field-label" id="dietaryLabel">Dietary restrictions or allergies</label>
    <input
        type="text"
        id="dietaryInput"
        class="text-input"
        placeholder="Vegetarian, gluten-free, etc."
        maxlength="200"
    >
</div>

<!-- Plus One Field (conditional) -->
<div class="plus-one-field" id="plusOneField" style="display: none;">
    <label class="field-label" id="plusOneLabel">Are you bringing someone?</label>
    <div class="plus-one-options">
        <label class="radio-option">
            <input type="radio" name="plusOne" id="plusOneYes" value="yes">
            <span id="plusOneYesLabel">Yes</span>
        </label>
        <label class="radio-option">
            <input type="radio" name="plusOne" id="plusOneNo" value="no" checked>
            <span id="plusOneNoLabel">No, just me</span>
        </label>
    </div>
    <input
        type="text"
        id="plusOneName"
        class="text-input"
        placeholder="Name of your guest"
        maxlength="50"
        style="display: none; margin-top: 8px;"
    >
</div>
```

### 2. styles.css - Lisää tyylit uusille kentille

Lisää tiedoston loppuun:

```css
/* Dietary Restrictions & Plus One Fields */
.dietary-field,
.plus-one-field {
    margin: 16px 0;
}

.field-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
}

.text-input {
    width: 100%;
    padding: 12px 16px;
    font-size: 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.text-input:focus {
    outline: none;
    border-color: #4A90E2;
}

.text-input::placeholder {
    color: #999;
}

.plus-one-options {
    display: flex;
    gap: 16px;
    margin-bottom: 8px;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 15px;
    color: #333;
}

.radio-option input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .field-label {
        color: #e0e0e0;
    }

    .text-input {
        background: #2a2a2a;
        border-color: #444;
        color: #e0e0e0;
    }

    .text-input::placeholder {
        color: #666;
    }

    .text-input:focus {
        border-color: #5A9FE2;
    }

    .radio-option {
        color: #e0e0e0;
    }
}
