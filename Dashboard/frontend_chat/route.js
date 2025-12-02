// Route Module
// Handles place selection, transport modes, route computation, and map polylines

// ============================================================================
// STATE
// ============================================================================
let selectedPlaces = [];
let currentTransportMode = 'driving';
let routePolylines = [];  // Track displayed route polylines
let transitLineMarkers = [];  // Track transit line label markers on polylines

// ============================================================================
// PLACE SELECTION
// ============================================================================

// Add place to selected list
async function addToSelected(placeId) {
    // Find place data from markers or enriched places
    const markerData = markers.find(m => m.placeData.placeId === placeId);
    if (!markerData) return;

    const placeData = markerData.placeData;

    // Check if already selected
    if (selectedPlaces.some(p => p.placeId === placeId)) {
        alert('Place already added!');
        return;
    }

    try {
        // Send to server
        await fetch(`${API_BASE_URL}/places/select/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(placeData)
        });

        // Add to local list
        selectedPlaces.push(placeData);
        renderSelectedPlaces();

        // Disable the add button
        const btn = document.querySelector(`.place-card[data-place-id="${placeId}"] .add-btn`);
        if (btn) {
            btn.disabled = true;
            btn.textContent = '✓ Added';
        }
    } catch (error) {
        console.error('Error adding place:', error);
    }
}

// Remove place from selected list
async function removeFromSelected(placeId) {
    try {
        await fetch(`${API_BASE_URL}/places/select/${sessionId}/${placeId}`, {
            method: 'DELETE'
        });

        selectedPlaces = selectedPlaces.filter(p => p.placeId !== placeId);
        renderSelectedPlaces();

        // Re-enable add button if place card exists
        const btn = document.querySelector(`.place-card[data-place-id="${placeId}"] .add-btn`);
        if (btn) {
            btn.disabled = false;
            btn.textContent = '+ Add to Route';
        }
    } catch (error) {
        console.error('Error removing place:', error);
    }
}

// ============================================================================
// TRANSPORT MODE
// ============================================================================

// Initialize transportation mode buttons
function initTransportModeButtons() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            modeButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Update current mode
            currentTransportMode = btn.dataset.mode;
            console.log('[Route] Transport mode changed to:', currentTransportMode);
        });
    });
}

// Get transport mode icon (SVG)
function getTransportIcon(mode) {
    const icons = {
        'driving': '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>',
        'transit': '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm2 0V6h5v5h-5zm3.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
        'walking': '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>',
        'bicycling': '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4 2.4-2.4 2.4 1.4 1.4 3.8-3.8-3.8-3.8-1.4 1.4zm8.2 1.5c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/></svg>'
    };
    return icons[mode] || icons['driving'];
}

// ============================================================================
// SELECTED PLACES LIST UI
// ============================================================================

// Render selected places list
function renderSelectedPlaces() {
    const container = document.getElementById('selectedPlacesList');
    const countEl = document.getElementById('selectedCount');

    countEl.textContent = selectedPlaces.length;

    if (selectedPlaces.length === 0) {
        container.innerHTML = `
            <div class="place-item-placeholder">
                <div class="placeholder-box">
                    <button class="drag-handle" disabled>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        document.getElementById('optimizeBtn').disabled = true;
        document.getElementById('directionBtn').disabled = true;
        return;
    }

    container.innerHTML = selectedPlaces.map((place, index) => {
        // S for start, E for end, numbers for intermediate stops
        const lastIndex = selectedPlaces.length - 1;
        let label, colorClass;
        if (index === 0) {
            label = 'S';  // Start
            colorClass = 'start';
        } else if (index === lastIndex) {
            label = 'E';  // End
            colorClass = 'end';
        } else {
            label = index;  // Intermediate stops numbered 1, 2, 3...
            colorClass = '';
        }

        return `
            <div class="place-item" data-index="${index}" data-place-id="${place.placeId}" draggable="true">
                <div class="place-number ${colorClass}">${label}</div>
                <div class="place-info">
                    <div class="place-name">${place.displayName}</div>
                </div>
                <button class="place-remove" onclick="removeFromSelected('${place.placeId}'); event.stopPropagation();" title="Remove">
                    ✕
                </button>
                <button class="drag-handle" title="Drag to reorder">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');

    // Enable buttons if we have at least 2 places
    const hasEnoughPlaces = selectedPlaces.length >= 2;
    document.getElementById('optimizeBtn').disabled = !hasEnoughPlaces;
    document.getElementById('directionBtn').disabled = !hasEnoughPlaces;

    // Initialize drag and drop
    initDragAndDrop();

    // Update marker icons on the map to show route order
    updateRouteMarkerIcons();
}

// Drag and drop functionality for reordering places
function initDragAndDrop() {
    const placeItems = document.querySelectorAll('.place-item');
    let draggedItem = null;

    placeItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedItem = null;
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        item.addEventListener('drop', async (e) => {
            e.preventDefault();
            if (draggedItem && draggedItem !== item) {
                const fromIndex = parseInt(draggedItem.dataset.index);
                const toIndex = parseInt(item.dataset.index);

                // Reorder the array
                const [movedPlace] = selectedPlaces.splice(fromIndex, 1);
                selectedPlaces.splice(toIndex, 0, movedPlace);

                // Re-render
                renderSelectedPlaces();

                // Sync new order to backend
                try {
                    const placeIds = selectedPlaces.map(p => p.placeId);
                    await fetch(`${API_BASE_URL}/places/reorder/${sessionId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(placeIds)
                    });
                    console.log('[Route] Place order synced to backend');
                } catch (error) {
                    console.error('[Route] Failed to sync place order:', error);
                }
            }
        });
    });
}

// ============================================================================
// ROUTE MARKER ICONS
// ============================================================================

/**
 * Update marker icons on the map to show route order labels (S, 1, 2, ..., E)
 * Uses createRouteMarkerIcon() from placeicons.js for selected places,
 * and restores original category icons for non-selected places
 */
function updateRouteMarkerIcons() {
    // Create a map of placeId to route position
    const routePositions = new Map();
    const lastIndex = selectedPlaces.length - 1;

    selectedPlaces.forEach((place, index) => {
        let label;
        if (index === 0) {
            label = 'S';  // Start
        } else if (index === lastIndex) {
            label = 'E';  // End
        } else {
            label = String(index);  // Intermediate stops numbered 1, 2, 3...
        }
        routePositions.set(place.placeId, label);
    });

    // Update all markers
    markers.forEach(markerObj => {
        const placeId = markerObj.placeData.placeId;
        const routeLabel = routePositions.get(placeId);

        if (routeLabel) {
            // This place is in the route - show labeled marker
            markerObj.marker.setIcon(createRouteMarkerIcon(routeLabel));
        } else {
            // Not in route - show original category icon
            const iconId = markerObj.placeData.iconId !== undefined ? markerObj.placeData.iconId : 7;
            markerObj.marker.setIcon(createMarkerIcon(iconId));
        }
    });
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

// Format duration to human readable
function formatDuration(seconds) {
    if (seconds < 60) return `${seconds} sec`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

// Format distance to human readable
function formatDistance(meters) {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
}

// ============================================================================
// ROUTE DETAILS UI
// ============================================================================

// Render route details in the left panel
function renderRouteDetails(route) {
    const legsContainer = document.getElementById('routeLegs');
    const totalDistanceEl = document.getElementById('totalDistance');
    const totalTimeEl = document.getElementById('totalTime');

    // Update summary
    totalDistanceEl.textContent = formatDistance(route.total_distance);
    totalTimeEl.textContent = formatDuration(route.total_duration);

    // Render legs
    if (!route.legs || route.legs.length === 0) {
        legsContainer.innerHTML = `
            <div class="route-empty">
                <p>No route details available</p>
            </div>
        `;
        return;
    }

    // Build route details with place stops and travel segments between them
    let html = '';
    const places = route.places || [];
    const icon = getTransportIcon(currentTransportMode);

    route.legs.forEach((leg, legIndex) => {
        // Get place label (S for start, E for end, numbers for intermediate)
        const startLabel = legIndex === 0 ? 'S' : legIndex;
        const startName = leg.start_name || places[legIndex]?.displayName || `Stop ${legIndex + 1}`;

        // Show starting place
        html += `
            <div class="route-place-stop">
                <div class="stop-number">${startLabel}</div>
                <div class="stop-name">${startName}</div>
            </div>
        `;

        // Show travel segment between places
        if (leg.error) {
            html += `
                <div class="route-travel-segment">
                    <div class="travel-segment-header">
                        <div class="segment-icon">${icon}</div>
                        <div class="segment-summary">Route not available</div>
                    </div>
                </div>
            `;
        } else if (currentTransportMode === 'transit' && leg.steps && leg.steps.length > 0) {
            // Transit mode - show detailed steps
            html += `<div class="route-travel-segment">`;
            html += `
                <div class="travel-segment-header">
                    <div class="segment-icon">${icon}</div>
                    <div class="segment-summary"><strong>${formatDuration(leg.duration)}</strong> • ${formatDistance(leg.distance)}</div>
                </div>
            `;
            html += '<div class="segment-steps">';

            leg.steps.forEach(step => {
                if (step.travelMode === 'WALK') {
                    // Walk: just icon + duration + distance (no "Walk" text)
                    html += `
                        <div class="segment-step walk-step">
                            <div class="mini-icon walk">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                                    <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
                                </svg>
                            </div>
                            <div class="segment-step-info">
                                <span class="walk-duration">${formatDuration(step.duration)}</span>
                                <span class="walk-distance">${formatDistance(step.distanceMeters)}</span>
                            </div>
                        </div>
                    `;
                } else if (step.travelMode === 'TRANSIT' && step.transitDetails) {
                    const td = step.transitDetails;
                    const lineLabel = td.lineShortName || td.vehicleType || 'Transit';
                    const iconClass = (td.vehicleType || 'bus').toLowerCase();

                    // Transit: vertical layout - start stop, stops count, end stop
                    html += `
                        <div class="segment-step transit-step">
                            <div class="transit-header">
                                <div class="mini-icon ${iconClass === 'subway' ? 'subway' : 'transit'}">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                                        <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
                                    </svg>
                                </div>
                                <div class="transit-line">${lineLabel}${td.headsign ? ` → ${td.headsign}` : ''}</div>
                                <div class="transit-duration">${formatDuration(step.duration)}</div>
                            </div>
                            <div class="transit-stops-detail">
                                <div class="stop-row start-stop">
                                    <span class="stop-name">${td.departureStop || 'Departure'}</span>
                                    ${td.departureTime ? `<span class="stop-time">${formatTime(td.departureTime)}</span>` : ''}
                                </div>
                                ${td.stopCount ? `<div class="stops-count">${td.stopCount} stops</div>` : ''}
                                <div class="stop-row end-stop">
                                    <span class="stop-name">${td.arrivalStop || 'Arrival'}</span>
                                    ${td.arrivalTime ? `<span class="stop-time">${formatTime(td.arrivalTime)}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            html += '</div></div>';
        } else {
            // Non-transit mode - simple summary
            html += `
                <div class="route-travel-segment">
                    <div class="travel-segment-header">
                        <div class="segment-icon">${icon}</div>
                        <div class="segment-summary"><strong>${formatDuration(leg.duration)}</strong> • ${formatDistance(leg.distance)}</div>
                    </div>
                </div>
            `;
        }
    });

    // Show final destination
    const lastLeg = route.legs[route.legs.length - 1];
    const endName = lastLeg.end_name || places[places.length - 1]?.displayName || `Stop ${route.legs.length + 1}`;
    html += `
        <div class="route-place-stop">
            <div class="stop-number">E</div>
            <div class="stop-name">${endName}</div>
        </div>
    `;

    legsContainer.innerHTML = html;
}

// Get vehicle type icon for transit
function getVehicleIcon(vehicleType) {
    const icons = {
        'BUS': '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>',
        'SUBWAY': '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm2 0V6h5v5h-5zm3.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
        'RAIL': '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M4 15.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V5c0-3.5-3.58-4-8-4s-8 .5-8 4v10.5zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-7H6V5h12v5z"/></svg>',
        'TRAM': '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 16.94V8.5c0-2.79-2.61-3.4-6.01-3.49l.76-1.51H17V2H7v1.5h4.75l-.76 1.52C7.86 5.11 5 5.73 5 8.5v8.44c0 1.45 1.19 2.66 2.59 2.97L6 21.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 20h-.08c1.69 0 2.58-1.37 2.58-3.06zm-7 1.56c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5-4.5H7V9h10v5z"/></svg>',
        'FERRY': '<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/></svg>'
    };
    return icons[vehicleType] || icons['BUS'];
}

// Format ISO time to readable format (e.g., "2:30 PM")
function formatTime(isoTime) {
    if (!isoTime) return '';
    try {
        const date = new Date(isoTime);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
        return '';
    }
}

// Clear route details
function clearRouteDetails() {
    const legsContainer = document.getElementById('routeLegs');
    const totalDistanceEl = document.getElementById('totalDistance');
    const totalTimeEl = document.getElementById('totalTime');

    legsContainer.innerHTML = '';
    totalDistanceEl.textContent = '--';
    totalTimeEl.textContent = '--';
}

// ============================================================================
// ROUTE COMPUTATION (API)
// ============================================================================

/**
 * Compute route for selected places
 * @param {Array} places - Array of place objects with placeId, name, formatted_address
 * @param {string} mode - Travel mode: 'driving', 'walking', 'bicycling', 'transit'
 * @param {boolean} optimize - Whether to optimize waypoint order
 * @param {string} departureTime - ISO datetime string (optional, required for transit)
 * @returns {Promise<Object>} Route result with places, duration, distance, legs
 */
async function computeRoute(places, mode, optimize = true, departureTime = null) {
    if (places.length < 2) {
        throw new Error('At least 2 places required');
    }

    // Convert frontend place format to backend format
    const backendPlaces = places.map(p => ({
        placeId: p.placeId,
        displayName: p.displayName,
        formattedAddress: p.formattedAddress || ''
    }));

    // Map frontend mode names to backend mode names
    const modeMap = {
        'driving': 'DRIVE',
        'walking': 'WALK',
        'bicycling': 'BICYCLE',
        'transit': 'TRANSIT'
    };

    const backendMode = modeMap[mode] || 'DRIVE';

    const requestBody = {
        places: backendPlaces,
        mode: backendMode,
        optimize_waypoint_order: optimize,
        session_id: sessionId  // Include session ID to persist route to database
    };

    if (departureTime) {
        requestBody.departure_time = departureTime;
    }

    const response = await fetch(`${API_BASE_URL}/routes/compute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Route computation failed');
    }

    const result = await response.json();

    // Convert backend response to frontend format
    return convertRouteResponse(result, mode);
}

/**
 * Convert backend route response to frontend format
 */
function convertRouteResponse(result, mode) {
    // Convert places back to frontend format
    const places = result.places.map(p => ({
        placeId: p.placeId,
        displayName: p.displayName,
        formattedAddress: p.formattedAddress
    }));

    // Handle TRANSIT vs other modes (different response structure)
    const isTransit = mode === 'transit';
    const totalDuration = isTransit ? result.totalDuration : result.duration;
    const totalDistance = isTransit ? result.totalDistanceMeters : result.distanceMeters;

    // Build legs with place names
    const legs = result.legs.map((leg, index) => {
        const legData = {
            duration: leg.duration,
            distance: leg.distanceMeters,
            polyline: leg.polyline,
            start_name: places[index]?.displayName || `Stop ${index + 1}`,
            end_name: places[index + 1]?.displayName || `Stop ${index + 2}`
        };

        // Add transit-specific step details
        if (isTransit && leg.steps) {
            legData.steps = leg.steps;
        }

        return legData;
    });

    return {
        mode: mode,
        places: places,
        optimized_order: places.map(p => p.placeId),
        total_duration: totalDuration,
        total_distance: totalDistance,
        legs: legs
    };
}

/**
 * Get default departure time (now + 5 minutes)
 */
function getDefaultDepartureTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString();
}

/**
 * Optimize and compute route for current selected places
 */
async function optimizeAndComputeRoute(optimize = true) {
    if (selectedPlaces.length < 2) {
        throw new Error('Need at least 2 places selected');
    }

    // For transit, use departure time
    const departureTime = currentTransportMode === 'transit' ? getDefaultDepartureTime() : null;

    return await computeRoute(selectedPlaces, currentTransportMode, optimize, departureTime);
}

// ============================================================================
// MAP POLYLINES
// ============================================================================

// Clear all route polylines and transit line markers from the map
function clearRoutePolylines() {
    routePolylines.forEach(polyline => {
        polyline.setMap(null);
    });
    routePolylines = [];

    // Also clear transit line markers
    transitLineMarkers.forEach(marker => {
        marker.setMap(null);
    });
    transitLineMarkers = [];
}

/**
 * Create a transit line marker icon (Google Maps style - flat badge on the line)
 * @param {string} lineLabel - Short name of the line (e.g., "19", "Canada Line")
 * @param {string} vehicleType - Type of vehicle (BUS, SUBWAY, RAIL, TRAM, FERRY)
 * @param {string} lineColor - Color of the transit line (hex color from API)
 * @returns {object} Google Maps icon object
 */
function createTransitLineMarkerIcon(lineLabel, vehicleType, lineColor) {
    // Use provided line color or default based on vehicle type
    const defaultColors = {
        'BUS': '#FF9800',      // Orange for bus
        'SUBWAY': '#2196F3',   // Blue for subway
        'RAIL': '#9C27B0',     // Purple for rail
        'TRAM': '#4CAF50',     // Green for tram
        'FERRY': '#00BCD4'     // Cyan for ferry
    };

    const bgColor = lineColor || defaultColors[vehicleType] || '#757575';

    // Truncate long line labels
    const displayLabel = lineLabel.length > 5 ? lineLabel.substring(0, 4) + '…' : lineLabel;

    // Calculate width based on label length (min 24px for short numbers, grows with longer labels)
    const labelWidth = Math.max(24, displayLabel.length * 8 + 12);
    const halfWidth = labelWidth / 2;
    const height = 18;

    // Google Maps style: simple rounded rectangle badge sitting on the polyline
    const markerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${labelWidth}" height="${height}" viewBox="0 0 ${labelWidth} ${height}">
  <!-- Background pill with white border (Google Maps style) -->
  <rect x="1" y="1" width="${labelWidth - 2}" height="${height - 2}" rx="4" fill="${bgColor}" stroke="white" stroke-width="1.5"/>
  <!-- Line label -->
  <text x="${halfWidth}" y="${height/2 + 4}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="11" font-weight="bold">${displayLabel}</text>
</svg>`;

    const encoded = encodeURIComponent(markerSvg).replace(/'/g, '%27').replace(/"/g, '%22');

    return {
        url: 'data:image/svg+xml,' + encoded,
        scaledSize: new google.maps.Size(labelWidth, height),
        anchor: new google.maps.Point(halfWidth, height / 2)  // Anchor at center (sits on the line)
    };
}

/**
 * Get the midpoint of a polyline path
 * @param {Array} path - Array of google.maps.LatLng points
 * @returns {google.maps.LatLng} Midpoint of the path
 */
function getPolylineMidpoint(path) {
    if (!path || path.length === 0) return null;

    // For very short paths, just return the first point
    if (path.length === 1) return path[0];

    // Calculate total path length and find midpoint
    let totalLength = 0;
    const segments = [];

    for (let i = 0; i < path.length - 1; i++) {
        const segmentLength = google.maps.geometry.spherical.computeDistanceBetween(path[i], path[i + 1]);
        segments.push({ start: path[i], end: path[i + 1], length: segmentLength });
        totalLength += segmentLength;
    }

    // Find the segment containing the midpoint
    const targetLength = totalLength / 2;
    let accumulatedLength = 0;

    for (const segment of segments) {
        if (accumulatedLength + segment.length >= targetLength) {
            // Midpoint is in this segment
            const remainingLength = targetLength - accumulatedLength;
            const fraction = remainingLength / segment.length;

            // Interpolate between segment start and end
            const lat = segment.start.lat() + (segment.end.lat() - segment.start.lat()) * fraction;
            const lng = segment.start.lng() + (segment.end.lng() - segment.start.lng()) * fraction;

            return new google.maps.LatLng(lat, lng);
        }
        accumulatedLength += segment.length;
    }

    // Fallback to last point
    return path[path.length - 1];
}

// Draw route polylines on the map
function drawRouteOnMap(route) {
    // Clear existing polylines
    clearRoutePolylines();

    if (!route.legs || route.legs.length === 0) {
        console.log('[Route] No legs to draw');
        return;
    }

    // Color scheme for different modes
    const modeColors = {
        'driving': '#4285F4',   // Google Blue
        'walking': '#34A853',   // Google Green
        'bicycling': '#FBBC04', // Google Yellow
        'transit': '#EA4335'    // Google Red
    };

    const strokeColor = modeColors[currentTransportMode] || '#4285F4';

    // Draw each leg
    route.legs.forEach((leg, index) => {
        if (leg.error) {
            console.log(`[Route] Skipping leg ${index + 1} due to error`);
            return;
        }

        // For transit mode, draw step polylines with different colors
        if (currentTransportMode === 'transit' && leg.steps) {
            leg.steps.forEach(step => {
                const polylines = step.polylines || (step.polyline ? [step.polyline] : []);

                // Get transit line color from API or use defaults
                let stepColor = '#757575';  // Default gray
                let lineColor = null;

                if (step.travelMode === 'WALK') {
                    stepColor = '#455A64';  // Dark gray for walking (Google Maps style)
                } else if (step.travelMode === 'TRANSIT' && step.transitDetails) {
                    // Use actual transit line color from API if available
                    lineColor = step.transitDetails.lineColor || null;
                    const vehicleType = (step.transitDetails.vehicleType || 'BUS').toUpperCase();

                    // Default colors by vehicle type if no API color
                    const defaultColors = {
                        'BUS': '#FF9800',
                        'SUBWAY': '#2196F3',
                        'RAIL': '#9C27B0',
                        'TRAM': '#4CAF50',
                        'FERRY': '#00BCD4'
                    };
                    stepColor = lineColor || defaultColors[vehicleType] || '#757575';
                }

                // Collect all paths for this step (to find midpoint for label)
                let allPathPoints = [];

                polylines.forEach(encodedPolyline => {
                    if (encodedPolyline) {
                        const path = google.maps.geometry.encoding.decodePath(encodedPolyline);

                        // Walking: dotted/dashed line (Google Maps style)
                        // Transit: solid colored line
                        const polylineOptions = {
                            path: path,
                            geodesic: true,
                            strokeColor: stepColor,
                            strokeWeight: step.travelMode === 'WALK' ? 4 : 5,
                            map: map
                        };

                        if (step.travelMode === 'WALK') {
                            // Dotted line for walking (Google Maps style)
                            polylineOptions.strokeOpacity = 0;
                            polylineOptions.icons = [{
                                icon: {
                                    path: 'M 0,-1 0,1',
                                    strokeOpacity: 1,
                                    strokeWeight: 4,
                                    scale: 2
                                },
                                offset: '0',
                                repeat: '12px'
                            }];
                        } else {
                            polylineOptions.strokeOpacity = 1.0;
                        }

                        const polyline = new google.maps.Polyline(polylineOptions);
                        routePolylines.push(polyline);

                        // Collect path points for midpoint calculation
                        allPathPoints = allPathPoints.concat(path.getArray ? path.getArray() : path);
                    }
                });

                // Add transit line label marker at midpoint of TRANSIT steps
                if (step.travelMode === 'TRANSIT' && step.transitDetails && allPathPoints.length > 0) {
                    const td = step.transitDetails;
                    const lineLabel = td.lineShortName || td.lineName || td.vehicleType || '?';
                    const vehicleType = (td.vehicleType || 'BUS').toUpperCase();

                    // Get midpoint of this transit segment
                    const midpoint = getPolylineMidpoint(allPathPoints);

                    if (midpoint) {
                        const lineMarker = new google.maps.Marker({
                            position: midpoint,
                            map: map,
                            icon: createTransitLineMarkerIcon(lineLabel, vehicleType, lineColor),
                            zIndex: 1000  // Above polylines
                        });
                        transitLineMarkers.push(lineMarker);
                    }
                }
            });
        } else if (leg.polyline) {
            // For DRIVE/WALK/BICYCLE, draw single polyline per leg
            const path = google.maps.geometry.encoding.decodePath(leg.polyline);
            const polyline = new google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: strokeColor,
                strokeOpacity: 1.0,
                strokeWeight: 5,
                map: map
            });
            routePolylines.push(polyline);
        }
    });

    console.log(`[Route] Drew ${routePolylines.length} polyline segments, ${transitLineMarkers.length} transit line markers`);

    // Fit map bounds to show the entire route
    if (routePolylines.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        routePolylines.forEach(polyline => {
            polyline.getPath().forEach(point => {
                bounds.extend(point);
            });
        });
        map.fitBounds(bounds);
    }
}

// ============================================================================
// ROUTE ACTIONS
// ============================================================================

// Optimize route
async function optimizeRoute() {
    const btn = document.getElementById('optimizeBtn');

    btn.disabled = true;
    btn.textContent = 'Optimizing...';

    try {
        // Compute route with optimization
        const route = await optimizeAndComputeRoute(true);

        console.log('Optimized route:', route);

        // Update the places list with optimized order
        if (route.places && route.places.length > 0) {
            // Update selectedPlaces with reordered places from backend
            const reorderedPlaces = route.places.map(p => {
                // Find the original place data by placeId
                const original = selectedPlaces.find(sp => sp.placeId === p.placeId);
                return original || p;
            }).filter(Boolean);

            if (reorderedPlaces.length === selectedPlaces.length) {
                selectedPlaces = reorderedPlaces;
                renderSelectedPlaces();
            }
        }

        // Render route details in panel
        renderRouteDetails(route);

        // Draw route on map
        drawRouteOnMap(route);

    } catch (error) {
        console.error('Optimization error:', error);
        alert('Failed to optimize route. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Optimize';
    }
}

// Get directions - computes route and draws on our Google Maps JS
async function getDirections() {
    if (selectedPlaces.length < 2) return;

    const btn = document.getElementById('directionBtn');
    btn.disabled = true;
    btn.textContent = 'Loading...';

    try {
        // Compute route without optimization (keep user's order)
        const route = await optimizeAndComputeRoute(false);

        console.log('Directions route:', route);

        // Render route details in panel
        renderRouteDetails(route);

        // Draw route on our embedded Google Map
        drawRouteOnMap(route);

    } catch (error) {
        console.error('Directions error:', error);
        alert('Failed to get directions. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Directions';
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize the route panel (called after DOM is ready)
function initRoutePanel() {
    initTransportModeButtons();

    // Add click handlers for action buttons
    document.getElementById('optimizeBtn').addEventListener('click', optimizeRoute);
    document.getElementById('directionBtn').addEventListener('click', getDirections);
}

// Call init when DOM is ready
document.addEventListener('DOMContentLoaded', initRoutePanel);