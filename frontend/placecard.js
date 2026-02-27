// Unified Place Card Module
// Handles display of place information cards across the application
// Used by: map markers, chat text mentions, selected places sidebar

let currentPlaceCard = null;
let hideTimeout = null;
let showTimeout = null;  // Track delayed show
let pendingPlaceData = null;  // Store place data during show delay
let pendingAnchorElement = null;  // Store anchor during show delay
let isSticky = false; // Track if card is in sticky mode (clicked)

// Session-scoped photo cache (cleared on page refresh)
// Prevents redundant API calls when user hovers same place multiple times
// Complies with Google Maps terms - temporary display caching only
let photoCache = {};

/**
 * Schedule showing a place card with a delay (prevents flickering on quick hovers)
 * @param {Object} placeData - Place information from enrichedPlacesBuffer or markers
 * @param {HTMLElement} anchorElement - Element to position the card near
 */
function showPlaceCard(placeData, anchorElement) {
    if (!placeData) return;

    // Cancel any pending show
    cancelPlaceCardShow();

    // Store the pending data
    pendingPlaceData = placeData;
    pendingAnchorElement = anchorElement;

    // Schedule show after 400ms delay
    showTimeout = setTimeout(() => {
        _showPlaceCardImmediate(pendingPlaceData, pendingAnchorElement);
        showTimeout = null;
        pendingPlaceData = null;
        pendingAnchorElement = null;
    }, 400);
}

/**
 * Cancel a pending place card show (called when user moves away quickly)
 */
function cancelPlaceCardShow() {
    if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = null;
    }
    pendingPlaceData = null;
    pendingAnchorElement = null;
}

/**
 * Show a place card immediately near the anchor element (internal use)
 * @param {Object} placeData - Place information from enrichedPlacesBuffer or markers
 * @param {HTMLElement} anchorElement - Element to position the card near
 */
function _showPlaceCardImmediate(placeData, anchorElement) {
    if (!placeData) return;

    // Remove any existing place card first (and cancel any pending shows)
    hidePlaceCard(true);

    // Create place card element
    const placeCard = document.createElement('div');
    placeCard.id = 'place-hover-card';
    placeCard.dataset.placeId = placeData.place_id;

    // Convert price level to dollar signs
    const getPriceDisplay = (priceLevel) => {
        const priceLevels = {
            'PRICE_LEVEL_FREE': 'Free',
            'PRICE_LEVEL_INEXPENSIVE': '$',
            'PRICE_LEVEL_MODERATE': '$$',
            'PRICE_LEVEL_EXPENSIVE': '$$$',
            'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$'
        };
        return priceLevels[priceLevel] || '';
    };

    // Parse opening hours status OR business status (mutually exclusive display)
    const getStatusDisplay = (openingHours, businessStatus) => {
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
        const periods = openingHours.periods || [];
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

        let statusClass = isOpen ? 'status-open' : 'status-closed';
        let statusWord = isOpen ? 'Open' : 'Closed';
        let nextChangeText = '';

        // Find next open/close time
        if (periods.length > 0) {
            // This is a simplified version - full implementation would need to handle week wraparound
            const todayPeriods = periods.filter(p => p.open && p.open.day === currentDay);

            if (isOpen && todayPeriods.length > 0) {
                // Find when it closes
                const closePeriod = todayPeriods.find(p => p.close && p.close.day === currentDay);
                if (closePeriod && closePeriod.close) {
                    const closeTime = `${closePeriod.close.hour}:${String(closePeriod.close.minute).padStart(2, '0')}`;
                    nextChangeText = ` • Closes at ${closeTime}`;
                }
            } else if (!isOpen && todayPeriods.length > 0) {
                // Find when it opens
                const openPeriod = todayPeriods[0];
                if (openPeriod.open) {
                    const openTime = `${openPeriod.open.hour}:${String(openPeriod.open.minute).padStart(2, '0')}`;
                    nextChangeText = ` • Opens at ${openTime}`;
                }
            }
        }

        return `<p class="opening-hours-status"><span class="${statusClass}">${statusWord}</span>${nextChangeText}</p>`;
    };

    // Build card HTML - Photo on top, then details (no address)
    // Use official Google Maps URI from enriched data, fallback to constructed URL if not available
    const googleMapsUrl = placeData.google_maps_uri ||
                         `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeData.name)}&query_place_id=${placeData.place_id}`;

    placeCard.innerHTML = `
        <button class="place-card-close" onclick="hidePlaceCard(); event.stopPropagation();" title="Close">✕</button>
        <div class="photo-container">
            <div class="photo-loading">Loading photo...</div>
        </div>
        <div class="place-info">
            <h3><a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="place-name-link">${placeData.name}</a></h3>
            ${placeData.rating ? `<p class="rating">⭐ ${placeData.rating} <span class="review-count">(${placeData.user_rating_count || 0})</span></p>` : ''}
            ${placeData.primary_type ? `<p class="primary-type">${placeData.primary_type}${placeData.price_level ? ' • ' + getPriceDisplay(placeData.price_level) : ''}</p>` : ''}
            ${getStatusDisplay(placeData.current_opening_hours, placeData.business_status)}
            <button onclick="addToSelected('${placeData.place_id}'); event.stopPropagation();">+ Add to Route</button>
        </div>
    `;

    // Position near the anchor element, but keep within screen bounds
    const rect = anchorElement.getBoundingClientRect();
    const cardWidth = 320; // Approximate card width
    const cardHeight = 450; // Approximate card height with photo

    let left = rect.right + 10;
    let top = rect.top;

    // Adjust horizontal position if card would go off right edge
    if (left + cardWidth > window.innerWidth) {
        left = rect.left - cardWidth - 10; // Show on left side instead
    }

    // Adjust vertical position if card would go off bottom edge
    if (top + cardHeight > window.innerHeight) {
        top = window.innerHeight - cardHeight - 10;
    }

    // Ensure card doesn't go off top edge
    if (top < 10) {
        top = 10;
    }

    placeCard.style.position = 'fixed';
    placeCard.style.left = left + 'px';
    placeCard.style.top = top + 'px';

    // Click on card makes it sticky
    placeCard.addEventListener('click', (e) => {
        // Don't trigger if clicking close button or add button
        if (e.target.classList.contains('place-card-close') || e.target.tagName === 'BUTTON') {
            return;
        }

        makeCardSticky();
    });

    // Cancel hide when hovering over the card
    placeCard.addEventListener('mouseenter', () => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
    });

    // Hide immediately when leaving the card (unless sticky)
    placeCard.addEventListener('mouseleave', () => {
        if (!isSticky) {
            schedulePlaceCardHide(false, true);  // immediate = true
        }
    });

    // Add to DOM
    document.body.appendChild(placeCard);
    currentPlaceCard = placeCard;

    // Load photo asynchronously
    loadPlacePhoto(placeData.place_id, placeCard);
}

/**
 * Make the current place card sticky (stay visible until explicitly closed)
 */
function makeCardSticky() {
    if (!currentPlaceCard) return;

    isSticky = true;

    // Clear any pending hide timeout
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }

    // Add click-outside-to-close functionality
    // Use setTimeout to prevent the current click event from immediately triggering the handler
    setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
    }, 0);
}

/**
 * Schedule hiding the place card with a short delay
 * This allows users to move their cursor from the trigger to the card
 * @param {boolean} cancelPending - Whether to cancel pending shows (default: false)
 * @param {boolean} immediate - If true, hide immediately with no delay (default: false)
 */
function schedulePlaceCardHide(cancelPending = false, immediate = false) {
    // Only cancel pending show if explicitly requested
    if (cancelPending) {
        cancelPlaceCardShow();
    }

    // Don't hide if card is sticky
    if (isSticky) return;

    // If no card visible, nothing to hide
    if (!currentPlaceCard) return;

    // Clear any existing timeout
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }

    if (immediate) {
        // Hide immediately (when leaving the card itself)
        hidePlaceCard();
    } else {
        // Short delay to allow cursor to reach the card (when leaving trigger)
        hideTimeout = setTimeout(() => {
            hidePlaceCard();
            hideTimeout = null;
        }, 150);
    }
}

/**
 * Handle clicks outside the place card to close it (only in sticky mode)
 */
function handleClickOutside(event) {
    if (isSticky && currentPlaceCard && !currentPlaceCard.contains(event.target)) {
        hidePlaceCard();
    }
}

/**
 * Hide the current place card immediately
 * @param {boolean} cancelPending - Whether to cancel pending shows (default: false)
 */
function hidePlaceCard(cancelPending = false) {
    // Only cancel pending show if explicitly requested
    // This allows hovering from one marker to another without losing the new show
    if (cancelPending) {
        cancelPlaceCardShow();
    }

    if (currentPlaceCard) {
        currentPlaceCard.remove();
        currentPlaceCard = null;
        isSticky = false;

        // Clear any pending hide timeout
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        // Remove the click-outside listener
        document.removeEventListener('click', handleClickOutside);
    }
}

/**
 * Load and display photo for a place (with session cache)
 * @param {string} placeId - Google Maps Place ID
 * @param {HTMLElement} placeCard - Place card element to update
 */
async function loadPlacePhoto(placeId, placeCard) {
    const photoContainer = placeCard.querySelector('.photo-container');
    if (!photoContainer) return;

    // Check session cache first
    if (photoCache[placeId]) {
        console.log(`✓ Photo cache HIT (session) for ${placeId}`);
        photoContainer.innerHTML = `
            <img src="${photoCache[placeId]}"
                 alt="Place photo"
                 class="place-photo"
                 loading="lazy">
        `;
        return;
    }

    try {
        console.log(`⚠️  Photo cache MISS for ${placeId} - fetching from API`);
        // Fetch photo from backend
        // Request 400px for sharp display on retina screens (card width ~256px, 2x = 512px)
        const response = await fetch(`${API_BASE_URL}/api/places/${placeId}/photo?max_width=400`);

        if (!response.ok) {
            throw new Error('Photo not available');
        }

        const data = await response.json();

        if (data.photo_url) {
            // Cache for this session
            photoCache[placeId] = data.photo_url;

            // Replace loading indicator with actual photo
            photoContainer.innerHTML = `
                <img src="${data.photo_url}"
                     alt="${data.place_name || 'Place photo'}"
                     class="place-photo"
                     loading="lazy">
            `;
        } else {
            // No photo available
            photoContainer.innerHTML = '<p class="no-photo">No photo available</p>';
        }
    } catch (error) {
        console.error('Error loading photo:', error);
        // Show error or hide photo section
        photoContainer.innerHTML = '<p class="no-photo">Photo unavailable</p>';
    }
}

/**
 * Check if a place card is currently visible
 * @returns {boolean} True if a place card is visible
 */
function isPlaceCardVisible() {
    return currentPlaceCard !== null;
}

/**
 * Handle mouseout from place link text (cancels pending show or schedules hide)
 */
function handlePlaceLinkMouseOut() {
    if (isPlaceCardVisible()) {
        // Card is showing - schedule hide with delay so user can reach it
        schedulePlaceCardHide();
    } else {
        // Card hasn't appeared yet - cancel the pending show
        cancelPlaceCardShow();
    }
}

// Export functions for use in other modules
window.isPlaceCardVisible = isPlaceCardVisible;
window.handlePlaceLinkMouseOut = handlePlaceLinkMouseOut;
