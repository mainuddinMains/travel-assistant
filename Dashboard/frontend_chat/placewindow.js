// Place Window Module
// Displays detailed place information in a sidebar that slides in from the right
// Triggered by clicking: highlighted place text, map markers, or place cards

let currentPlaceWindow = null;

/**
 * Show place window with detailed information
 * @param {Object} placeData - Place information from enrichedPlacesBuffer or markers
 */
function showPlaceWindow(placeData) {
    if (!placeData) return;

    // Close any existing place window
    closePlaceWindow();

    // Create place window element
    const placeWindow = document.createElement('div');
    placeWindow.id = 'place-window';
    placeWindow.className = 'place-window';

    // Position based on chat section visibility
    updatePlaceWindowPosition(placeWindow);

    // Build the HTML content
    placeWindow.innerHTML = `
        <div class="place-window-header">
            <h2>${placeData.displayName}</h2>
            <button class="close-btn" onclick="closePlaceWindow()">×</button>
        </div>
        <div class="place-window-content">
            <div class="place-window-photo">
                <div class="photo-loading">Loading photo...</div>
            </div>
            <div class="place-window-details">
                <p class="address">${placeData.formattedAddress || placeData.address || ''}</p>
                ${placeData.rating ? `<p class="rating">⭐ ${placeData.rating} <span class="review-count">(${placeData.userRatingCount || 0} reviews)</span></p>` : ''}
                ${placeData.primaryTypeDisplayName ? `<p class="type">${placeData.primaryTypeDisplayName}</p>` : ''}
                ${placeData.priceLevel ? `<p class="price">${getPriceLevelDisplay(placeData.priceLevel)}</p>` : ''}
                ${getBusinessStatusDisplay(placeData.currentOpeningHours, placeData.businessStatus)}
            </div>
            <div class="place-window-actions">
                <button class="add-to-route-btn" onclick="addToSelected('${placeData.placeId}'); event.stopPropagation();">+ Add to Route</button>
                ${placeData.googleMapsUri ? `<a href="${placeData.googleMapsUri}" target="_blank" class="view-on-maps-btn">View on Google Maps</a>` : ''}
            </div>
        </div>
    `;

    // Add to DOM
    document.body.appendChild(placeWindow);
    currentPlaceWindow = placeWindow;

    // Show immediately
    placeWindow.classList.add('visible');

    // Load photo asynchronously
    loadPlaceWindowPhoto(placeData.placeId, placeWindow);

    // Close when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 100);
}

/**
 * Close the place window
 */
function closePlaceWindow() {
    if (currentPlaceWindow) {
        // Remove immediately
        currentPlaceWindow.classList.remove('visible');

        if (currentPlaceWindow.parentNode) {
            currentPlaceWindow.remove();
        }
        currentPlaceWindow = null;

        // Remove outside click listener
        document.removeEventListener('click', handleOutsideClick);
    }
}

/**
 * Handle clicks outside the place window
 */
function handleOutsideClick(event) {
    if (currentPlaceWindow && !currentPlaceWindow.contains(event.target)) {
        // Don't close if clicking on a place link, marker, or place card
        if (event.target.closest('.place-link') ||
            event.target.closest('#place-hover-card')) {
            return;
        }
        closePlaceWindow();
    }
}

/**
 * Load and display photo for place window
 * @param {string} placeId - Google Maps Place ID
 * @param {HTMLElement} placeWindow - Place window element
 */
async function loadPlaceWindowPhoto(placeId, placeWindow) {
    const photoContainer = placeWindow.querySelector('.place-window-photo');
    if (!photoContainer) return;

    // Check session cache first (reuse cache from placecard.js)
    if (typeof photoCache !== 'undefined' && photoCache[placeId]) {
        console.log(`✓ Photo cache HIT (window) for ${placeId}`);
        photoContainer.innerHTML = `
            <img src="${photoCache[placeId]}"
                 alt="Place photo"
                 class="place-photo">
        `;
        return;
    }

    try {
        console.log(`⚠️  Fetching photo for place window: ${placeId}`);
        const response = await fetch(`${API_BASE_URL}/api/places/${placeId}/photo?max_width=600`);

        if (!response.ok) {
            throw new Error('Photo not available');
        }

        const data = await response.json();

        if (data.photoUrl) {
            // Cache for session (if photoCache is available)
            if (typeof photoCache !== 'undefined') {
                photoCache[placeId] = data.photoUrl;
            }

            photoContainer.innerHTML = `
                <img src="${data.photoUrl}"
                     alt="${data.placeName || 'Place photo'}"
                     class="place-photo">
            `;
        } else {
            photoContainer.innerHTML = '<p class="no-photo">No photo available</p>';
        }
    } catch (error) {
        console.error('Error loading photo:', error);
        photoContainer.innerHTML = '<p class="no-photo">Photo unavailable</p>';
    }
}

/**
 * Get price level display string
 */
function getPriceLevelDisplay(priceLevel) {
    const priceLevels = {
        'PRICE_LEVEL_FREE': 'Free',
        'PRICE_LEVEL_INEXPENSIVE': '$',
        'PRICE_LEVEL_MODERATE': '$$',
        'PRICE_LEVEL_EXPENSIVE': '$$$',
        'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$'
    };
    return priceLevels[priceLevel] || '';
}

/**
 * Get business status display HTML
 */
function getBusinessStatusDisplay(openingHours, businessStatus) {
    // Check business status first (takes priority)
    if (businessStatus && businessStatus !== 'OPERATIONAL') {
        const statusMessages = {
            'CLOSED_TEMPORARILY': 'Temporarily Closed',
            'CLOSED_PERMANENTLY': 'Permanently Closed'
        };
        const statusText = statusMessages[businessStatus] || `Status: ${businessStatus}`;
        return `<p class="status-closed">${statusText}</p>`;
    }

    // Otherwise show opening hours
    if (!openingHours || openingHours.openNow === undefined) {
        return '';
    }

    const isOpen = openingHours.openNow;
    const statusClass = isOpen ? 'status-open' : 'status-closed';
    const statusWord = isOpen ? 'Open' : 'Closed';

    return `<p class="opening-hours"><span class="${statusClass}">${statusWord}</span></p>`;
}

/**
 * Update place window position based on chat section visibility
 * @param {HTMLElement} placeWindow - Place window element
 */
function updatePlaceWindowPosition(placeWindow) {
    const chatSection = document.querySelector('.right-section');

    if (chatSection) {
        // Check if chat section is visible
        const isChatVisible = chatSection.style.display !== 'none' &&
                             window.getComputedStyle(chatSection).display !== 'none';

        if (isChatVisible) {
            // Chat is visible: position left of chat (400px from right)
            const chatWidth = chatSection.offsetWidth || 400;
            placeWindow.style.right = chatWidth + 'px';
        } else {
            // Chat is hidden: position at right edge of map (0px from right)
            placeWindow.style.right = '0px';
        }
    } else {
        // Default: position left of chat section
        placeWindow.style.right = '400px';
    }
}

/**
 * Global function to reposition place window when chat visibility changes
 * Call this function when hiding/showing the chat section
 */
function repositionPlaceWindow() {
    if (currentPlaceWindow) {
        updatePlaceWindowPosition(currentPlaceWindow);
    }
}
