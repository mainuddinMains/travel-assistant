// Google Maps functionality
let map = null;
let markers = [];
let displayedPlaceIds = new Set();  // Track which places already have markers

// Load Google Maps API dynamically
function loadGoogleMapsAPI() {
    console.log('[Google Maps] Loading Google Maps API...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${FRONTEND_CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
        console.error('[Google Maps] Failed to load Google Maps API');
    };
    document.head.appendChild(script);
}

// Initialize Google Map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 49.2827, lng: -123.1207 }, // Vancouver default
        zoom: 12,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ],
        // Only keep fullscreen and camera controls (zoom/pan)
        mapTypeControl: false,          // Disable map type selector (Map/Satellite)
        streetViewControl: false,       // Disable Street View pegman
        fullscreenControl: true,        // Keep fullscreen toggle
        zoomControl: true,              // Keep zoom controls (camera control)
        gestureHandling: 'greedy',      // Allow pan/zoom gestures (camera control)
        clickableIcons: false           // Disable default POI click popups
    });

    console.log('[Google Maps] ✓ Google Maps connected');

    // Call the callback to initialize trip metadata
    if (window.onGoogleMapsLoaded) {
        window.onGoogleMapsLoaded();
    }
}

// Add marker to map
// Uses createMarkerIcon() from placeicons.js
function addMarker(placeData) {
    if (!placeData.location) return;

    // Prevent duplicate markers
    if (displayedPlaceIds.has(placeData.place_id)) {
        return;
    }

    // Get the icon ID from backend (0-7), default to 7 if not provided
    const iconId = placeData.icon_id !== undefined ? placeData.icon_id : 7;

    const marker = new google.maps.Marker({
        position: {
            lat: placeData.location.latitude,
            lng: placeData.location.longitude
        },
        map: map,
        // Don't set title - we show our own place card instead of browser tooltip
        icon: createMarkerIcon(iconId)
    });

    // Create info window with place details
    const infoWindowContent = `
        <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">${placeData.name}</h3>
            ${placeData.formatted_address ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">${placeData.formatted_address}</p>` : ''}
            ${placeData.rating ? `<p style="margin: 0 0 8px 0; font-size: 13px;">⭐ ${placeData.rating} (${placeData.user_rating_count || 0} reviews)</p>` : ''}
            <button onclick="addToSelected('${placeData.place_id}')"
                    style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px;">
                + Add to Route
            </button>
        </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
        content: infoWindowContent
    });

    // Store anchor element for consistent positioning
    let markerAnchor = null;

    // Helper: Get screen position for marker (right edge of marker icon)
    function getMarkerScreenPosition() {
        const projection = map.getProjection();
        const bounds = map.getBounds();
        const mapDiv = map.getDiv();
        const mapRect = mapDiv.getBoundingClientRect();

        if (!projection || !bounds) return null;

        // Get marker position in lat/lng
        const markerPos = marker.getPosition();

        // Get top-left corner of visible map (NorthWest)
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const nw = new google.maps.LatLng(ne.lat(), sw.lng());

        // Convert to world coordinates
        const worldPoint = projection.fromLatLngToPoint(markerPos);
        const topLeftWorld = projection.fromLatLngToPoint(nw);

        // Calculate zoom scale
        const zoom = map.getZoom();
        const scale = Math.pow(2, zoom);

        // Pixel position within map (relative to top-left corner)
        const pixelX = (worldPoint.x - topLeftWorld.x) * scale;
        const pixelY = (worldPoint.y - topLeftWorld.y) * scale;

        // Offset for marker icon (40x48, anchor at bottom center)
        // Position anchor at right edge of marker: +20px right, -24px up (middle of marker)
        return {
            left: mapRect.left + pixelX + 20,  // Right edge of marker
            top: mapRect.top + pixelY - 24     // Middle height of marker
        };
    }

    // Show place card on HOVER using unified place card module
    marker.addListener('mouseover', () => {
        // Clean up any previous anchor
        if (markerAnchor && markerAnchor.parentNode) {
            markerAnchor.parentNode.removeChild(markerAnchor);
        }

        // Get marker's screen position (right edge)
        const screenPos = getMarkerScreenPosition();
        if (!screenPos) return;

        // Create anchor at marker's right edge
        markerAnchor = document.createElement('div');
        markerAnchor.style.position = 'fixed';
        markerAnchor.style.left = screenPos.left + 'px';
        markerAnchor.style.top = screenPos.top + 'px';
        markerAnchor.style.width = '0';
        markerAnchor.style.height = '0';
        document.body.appendChild(markerAnchor);

        // Show place card (with delay)
        showPlaceCard(placeData, markerAnchor);
    });

    marker.addListener('mouseout', () => {
        if (isPlaceCardVisible()) {
            // Card is showing - schedule hide with delay so user can reach it
            schedulePlaceCardHide();
        } else {
            // Card hasn't appeared yet - cancel the pending show
            cancelPlaceCardShow();
        }
    });

    // Click on marker makes card sticky at same position as hover
    marker.addListener('click', () => {
        // If card is already showing from hover, just make it sticky
        // Otherwise, show it at marker position first
        if (!markerAnchor || !isPlaceCardVisible()) {
            // Get marker's screen position
            const screenPos = getMarkerScreenPosition();
            if (!screenPos) return;

            markerAnchor = document.createElement('div');
            markerAnchor.style.position = 'fixed';
            markerAnchor.style.left = screenPos.left + 'px';
            markerAnchor.style.top = screenPos.top + 'px';
            markerAnchor.style.width = '0';
            markerAnchor.style.height = '0';
            document.body.appendChild(markerAnchor);

            showPlaceCard(placeData, markerAnchor);
        }

        // Make the card sticky
        makeCardSticky();
    });

    markers.push({ marker, placeData, infoWindow });
    displayedPlaceIds.add(placeData.place_id);

    // Fit bounds to show all markers
    if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(m => bounds.extend(m.marker.getPosition()));
        map.fitBounds(bounds);
    }
}

// Pan map to specific marker and open info window
function panToMarker(placeId) {
    const markerObj = markers.find(m => m.placeData.place_id === placeId);
    if (markerObj) {
        map.panTo(markerObj.marker.getPosition());
        map.setZoom(15);

        // Close all info windows
        markers.forEach(m => {
            if (m.infoWindow) {
                m.infoWindow.close();
            }
        });

        // Open this marker's info window
        markerObj.infoWindow.open(map, markerObj.marker);
    }
}