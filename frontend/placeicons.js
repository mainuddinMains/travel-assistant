// Place Icon Mapping for Map Markers
// Icon ID (0-7) from backend maps to category-specific SVG markers

// Icon ID to category name mapping
// Matches backend place_icons.py ICON_CATEGORIES
const ICON_ID_TO_CATEGORY = {
    0: 'food',
    1: 'shopping',
    2: 'entertainment',
    3: 'lodging',
    4: 'health',
    5: 'sports',
    6: 'transport',
    7: 'default'
};

// SVG icon paths for each category
const CATEGORY_ICONS = {
    // Fork & Spoon for food
    'food': `<path d="M7 4v3c0 1.1.9 2 2 2h0c1.1 0 2-.9 2-2V4M9 9v10M15 4a3 3 0 0 1 0 6v9" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="7" y1="4" x2="7" y2="4.01" stroke="#333" stroke-width="1.5" stroke-linecap="round"/><line x1="9" y1="4" x2="9" y2="4.01" stroke="#333" stroke-width="1.5" stroke-linecap="round"/><line x1="11" y1="4" x2="11" y2="4.01" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>`,

    // Shopping bag
    'shopping': `<path d="M6 8h12l1 12H5L6 8z" stroke="#333" stroke-width="1.5" fill="none"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,

    // Tree for parks/entertainment
    'entertainment': `<path d="M12 20v-6m0 0l-4 0c0-3 2-6 4-8c2 2 4 5 4 8h-4z" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,

    // Bed for lodging
    'lodging': `<path d="M4 14v4m16-4v4M4 14h16M4 10h3v4m10-4h3v4M7 10V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,

    // Plus/cross for health
    'health': `<path d="M12 6v12M6 12h12" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>`,

    // Dumbbell for sports
    'sports': `<path d="M6 10v4m12-4v4M6 12h12M4 9v6m16-6v6" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,

    // Bus/transit icon
    'transport': `<rect x="6" y="6" width="12" height="11" rx="2" stroke="#333" stroke-width="1.5" fill="none"/><path d="M6 12h12M9 15h.01M15 15h.01" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M8 17v2m8-2v2" stroke="#333" stroke-width="1.5" fill="none"/>`,

    // Map pin for default
    'default': `<circle cx="12" cy="10" r="3" stroke="#333" stroke-width="1.5" fill="none"/><path d="M12 21c-4-5-7-8-7-11a7 7 0 0 1 14 0c0 3-3 6-7 11z" stroke="#333" stroke-width="1.5" fill="none"/>`
};

/**
 * Create a map marker icon for a given icon ID
 * @param {number} iconId - Icon ID (0-7) from backend
 * @returns {object} Google Maps icon object with url, scaledSize, and anchor
 */
function createMarkerIcon(iconId) {
    const category = ICON_ID_TO_CATEGORY[iconId] || 'default';
    const iconContent = CATEGORY_ICONS[category] || CATEGORY_ICONS['default'];

    // Circular white marker with shadow and icon
    const markerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
  <!-- Shadow ellipse -->
  <ellipse cx="21" cy="45" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
  <!-- Pointer/pin bottom -->
  <path d="M20 36l-6-6h12l-6 6z" fill="white" stroke="#333" stroke-width="1"/>
  <!-- White circle background -->
  <circle cx="20" cy="18" r="16" fill="white" stroke="#333" stroke-width="1.5"/>
  <!-- Icon (centered in circle) -->
  <g transform="translate(8, 6)">
    ${iconContent}
  </g>
</svg>`;

    const encoded = encodeURIComponent(markerSvg).replace(/'/g, '%27').replace(/"/g, '%22');

    return {
        url: 'data:image/svg+xml,' + encoded,
        scaledSize: new google.maps.Size(40, 48),
        anchor: new google.maps.Point(20, 48)
    };
}

/**
 * Create a labeled route marker (S, 1, 2, ..., E)
 * @param {string} label - Label to show (S, E, or number)
 * @returns {object} Google Maps icon object
 */
function createRouteMarkerIcon(label) {
    // Colors matching the place list UI
    let bgColor, borderColor;
    if (label === 'S') {
        bgColor = '#4CAF50';  // Green for Start
        borderColor = '#388E3C';
    } else if (label === 'E') {
        bgColor = '#f44336';  // Red for End
        borderColor = '#c62828';
    } else {
        bgColor = '#2196F3';  // Blue for intermediate stops
        borderColor = '#1565C0';
    }

    const markerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
  <!-- Shadow ellipse -->
  <ellipse cx="21" cy="45" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
  <!-- Pointer/pin bottom -->
  <path d="M20 36l-6-6h12l-6 6z" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>
  <!-- Colored circle background -->
  <circle cx="20" cy="18" r="16" fill="${bgColor}" stroke="${borderColor}" stroke-width="1.5"/>
  <!-- Label text -->
  <text x="20" y="23" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${label}</text>
</svg>`;

    const encoded = encodeURIComponent(markerSvg).replace(/'/g, '%27').replace(/"/g, '%22');

    return {
        url: 'data:image/svg+xml,' + encoded,
        scaledSize: new google.maps.Size(40, 48),
        anchor: new google.maps.Point(20, 48)
    };
}

// Export for use in other modules
window.createMarkerIcon = createMarkerIcon;
window.createRouteMarkerIcon = createRouteMarkerIcon;
window.ICON_ID_TO_CATEGORY = ICON_ID_TO_CATEGORY;
