/**
 * tripmeta.js - Trip Metadata Management
 *
 * City and schedule management with date range picker
 */

// Global trip metadata state
let tripMetadata = {
    cities: [],  // Changed from single city to array of cities
    schedule: '',
    startDate: null,
    endDate: null
};

// Drag and drop state
let draggedCityIndex = null;

// Date picker state
let datePickerVisible = false;
let selectedStartDate = null;
let selectedEndDate = null;
let selectingEndDate = false;
let currentCalendarDate = new Date();

// City search state
let citySearchVisible = false;
let cityAutocomplete = null;

/**
 * Initialize trip metadata functionality
 */
function initTripMeta() {
    initCityButton();
    initScheduleButton();
    createCityCardsContainer();
    createDatePicker();
    addDatePickerStyles();

    // Enable buttons now that Google Maps is loaded
    enableMetaButtons();
}

/**
 * Enable City and Schedule buttons after Google Maps loads
 */
function enableMetaButtons() {
    const cityBtn = document.getElementById('cityBtn');
    const scheduleBtn = document.getElementById('scheduleBtn');

    if (cityBtn) {
        cityBtn.disabled = false;
        cityBtn.style.opacity = '1';
        cityBtn.style.cursor = 'pointer';
    }

    if (scheduleBtn) {
        scheduleBtn.disabled = false;
        scheduleBtn.style.opacity = '1';
        scheduleBtn.style.cursor = 'pointer';
    }
}

/**
 * Initialize city button
 */
function initCityButton() {
    const cityBtn = document.getElementById('cityBtn');

    if (!cityBtn) {
        console.error('City button element not found');
        return;
    }

    // Create city search dropdown
    createCitySearch();

    // Show city search on click
    cityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCitySearch();
    });

    // Close city search when clicking outside
    document.addEventListener('click', (e) => {
        const citySearch = document.getElementById('citySearch');
        if (citySearchVisible &&
            citySearch &&
            !citySearch.contains(e.target) &&
            e.target !== cityBtn) {
            hideCitySearch();
        }
    });
}

/**
 * Initialize schedule button
 */
function initScheduleButton() {
    const scheduleBtn = document.getElementById('scheduleBtn');

    if (!scheduleBtn) {
        console.error('Schedule button element not found');
        return;
    }

    // Show date picker on click
    scheduleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDatePicker();
    });

    // Close date picker when clicking outside
    document.addEventListener('click', (e) => {
        const datePicker = document.getElementById('datePicker');
        if (datePickerVisible &&
            datePicker &&
            !datePicker.contains(e.target) &&
            e.target !== scheduleBtn) {
            hideDatePicker();
        }
    });
}

/**
 * Create city cards container (removed - now inside dropdown)
 */
function createCityCardsContainer() {
    // No longer needed - cards are inside the city search dropdown
}

/**
 * Create city search dropdown
 */
function createCitySearch() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'cityModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.onclick = () => hideCitySearch();
    document.body.appendChild(overlay);

    // Create modal box
    const citySearch = document.createElement('div');
    citySearch.id = 'citySearch';
    citySearch.className = 'city-search';
    citySearch.style.display = 'none';
    citySearch.onclick = (e) => e.stopPropagation(); // Prevent closing when clicking inside

    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'citySearchInput';
    searchInput.className = 'city-search-input';
    searchInput.placeholder = 'Search for a city...';

    // Create container for city cards (inside the dropdown)
    const cardsContainer = document.createElement('div');
    cardsContainer.id = 'cityCardsContainer';
    cardsContainer.className = 'city-cards-container';

    citySearch.appendChild(searchInput);
    citySearch.appendChild(cardsContainer);
    document.body.appendChild(citySearch);

    // Add city search styles
    addCitySearchStyles();
}

/**
 * Add CSS styles for city search
 */
function addCitySearchStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Overlay background */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
            display: none;
        }

        .modal-overlay.visible {
            display: block;
        }

        .city-search {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            padding: 24px;
            z-index: 10000;
            width: 450px;
            min-width: 450px;
            min-height: 500px;
            display: flex;
            flex-direction: column;
        }

        .city-search-input {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            font-size: 16px;
            font-family: inherit;
            box-sizing: border-box;
            margin-bottom: 16px;
        }

        .city-search-input:focus {
            outline: none;
            border-color: #2196F3;
        }

        .city-cards-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
            overflow-y: auto;
            max-height: 400px;
        }

        .city-cards-container:empty {
            display: none;
        }

        .city-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 14px 16px;
            font-size: 16px;
            color: #333;
            cursor: move;
            user-select: none;
            transition: all 0.2s;
        }

        .city-card:hover {
            background: #e9ecef;
            border-color: #2196F3;
        }

        .city-card.dragging {
            opacity: 0.5;
            cursor: grabbing;
        }

        .city-card.drag-over {
            border-color: #2196F3;
            border-style: dashed;
        }

        .city-card-name {
            font-weight: 500;
            flex: 1;
        }

        .city-card-remove {
            background: none;
            border: none;
            color: #999;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            transition: color 0.2s;
            flex-shrink: 0;
        }

        .city-card-remove:hover {
            color: #f44336;
        }

        /* Google Places Autocomplete dropdown styling */
        .pac-container {
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            border: 1px solid #e0e0e0;
            margin-top: 4px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            z-index: 10001 !important;  /* Must be higher than modal (10000) */
        }

        .pac-item {
            padding: 8px 12px;
            font-size: 14px;
            cursor: pointer;
            border-top: 1px solid #f0f0f0;
        }

        .pac-item:first-child {
            border-top: none;
        }

        .pac-item:hover {
            background-color: #f5f5f5;
        }

        .pac-item-query {
            font-size: 14px;
            color: #333;
        }

        .pac-matched {
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Create date picker element
 */
function createDatePicker() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'dateModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.onclick = () => hideDatePicker();
    document.body.appendChild(overlay);

    // Create modal box
    const datePicker = document.createElement('div');
    datePicker.id = 'datePicker';
    datePicker.className = 'date-picker';
    datePicker.style.display = 'none';
    datePicker.onclick = (e) => e.stopPropagation(); // Prevent closing when clicking inside
    document.body.appendChild(datePicker);
}

/**
 * Add CSS styles for date picker
 */
function addDatePickerStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .date-picker {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            padding: 24px;
            z-index: 10000;
            width: 450px;
            min-width: 450px;
            min-height: 500px;
        }

        .date-picker-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .date-picker-header button {
            background: none;
            border: none;
            font-size: 22px;
            cursor: pointer;
            padding: 4px 8px;
            color: #666;
        }

        .date-picker-header button:hover {
            color: #333;
        }

        .date-picker-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }

        .date-picker-calendar {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
        }

        .date-picker-day-label {
            text-align: center;
            font-size: 14px;
            font-weight: 600;
            color: #666;
            padding: 10px 4px;
        }

        .date-picker-day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            color: #333;
            border: 1px solid transparent;
        }

        .date-picker-day:hover:not(.disabled) {
            background: #f5f5f5;
        }

        .date-picker-day.disabled {
            color: #ccc;
            cursor: not-allowed;
        }

        .date-picker-day.selected {
            background: #2196F3;
            color: white;
        }

        .date-picker-day.in-range {
            background: #E3F2FD;
            color: #2196F3;
        }

        .date-picker-day.today {
            border-color: #2196F3;
        }

        .date-picker-footer {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            gap: 8px;
        }

        .date-picker-footer button {
            flex: 1;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            border: none;
        }

        .date-picker-footer .cancel-btn {
            background: #f5f5f5;
            color: #666;
        }

        .date-picker-footer .cancel-btn:hover {
            background: #e0e0e0;
        }

        .date-picker-footer .apply-btn {
            background: #2196F3;
            color: white;
        }

        .date-picker-footer .apply-btn:hover {
            background: #1976D2;
        }

        .date-picker-footer .apply-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}


/**
 * Toggle city search visibility
 */
function toggleCitySearch() {
    if (citySearchVisible) {
        hideCitySearch();
    } else {
        showCitySearch();
    }
}

/**
 * Show city search
 */
function showCitySearch() {
    const citySearch = document.getElementById('citySearch');
    const citySearchInput = document.getElementById('citySearchInput');
    const overlay = document.getElementById('cityModalOverlay');

    if (!citySearch || !citySearchInput || !overlay) return;

    // Render existing city cards
    renderCityCards();

    // Show overlay and modal
    overlay.classList.add('visible');
    citySearch.style.display = 'flex';
    citySearchVisible = true;

    // Initialize Google Places Autocomplete if not already done
    if (!cityAutocomplete) {
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.error('Google Maps Places library not loaded!');
            return;
        }

        cityAutocomplete = new google.maps.places.Autocomplete(citySearchInput, {
            types: ['(cities)'],  // Restrict to cities only
            fields: ['name', 'formatted_address', 'geometry', 'place_id', 'address_components']
        });

        // Listen for place selection - automatically add when user clicks a city
        cityAutocomplete.addListener('place_changed', () => {
            const place = cityAutocomplete.getPlace();

            if (!place.geometry) {
                return;
            }

            // Extract city name
            let cityName = place.name;

            // Create city object
            const cityData = {
                name: cityName,
                formatted_address: place.formatted_address,
                location: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                },
                place_id: place.place_id
            };

            // Add to cities array
            tripMetadata.cities.push(cityData);

            // Render city cards
            renderCityCards();

            // Clear input for next city
            const citySearchInput = document.getElementById('citySearchInput');
            if (citySearchInput) {
                citySearchInput.value = '';
            }

            // Trigger callback if defined
            if (window.onCityChanged) {
                window.onCityChanged(tripMetadata.cities);
            }
        });
    }

    // Focus on input
    setTimeout(() => citySearchInput.focus(), 100);
}

/**
 * Hide city search
 */
function hideCitySearch() {
    const citySearch = document.getElementById('citySearch');
    const citySearchInput = document.getElementById('citySearchInput');
    const overlay = document.getElementById('cityModalOverlay');

    if (citySearch) {
        citySearch.style.display = 'none';
        citySearchVisible = false;
    }

    if (overlay) {
        overlay.classList.remove('visible');
    }

    // Clear input
    if (citySearchInput) {
        citySearchInput.value = '';
    }
}

/**
 * Toggle date picker visibility
 */
function toggleDatePicker() {
    if (datePickerVisible) {
        hideDatePicker();
    } else {
        showDatePicker();
    }
}

/**
 * Show date picker
 */
function showDatePicker() {
    const datePicker = document.getElementById('datePicker');
    const overlay = document.getElementById('dateModalOverlay');

    if (!datePicker || !overlay) return;

    // Reset calendar to current month
    currentCalendarDate = new Date();

    // Render calendar
    renderCalendar();

    // Show overlay and modal
    overlay.classList.add('visible');
    datePicker.style.display = 'block';
    datePickerVisible = true;
}

/**
 * Hide date picker
 */
function hideDatePicker() {
    const datePicker = document.getElementById('datePicker');
    const overlay = document.getElementById('dateModalOverlay');

    if (datePicker) {
        datePicker.style.display = 'none';
        datePickerVisible = false;
    }

    if (overlay) {
        overlay.classList.remove('visible');
    }
}

/**
 * Render calendar for current month
 */
function renderCalendar() {
    const datePicker = document.getElementById('datePicker');
    if (!datePicker) return;

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    // Clear previous content
    datePicker.innerHTML = '';

    // Create header
    const header = document.createElement('div');
    header.className = 'date-picker-header';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '‹';
    prevBtn.onclick = (e) => {
        e.stopPropagation();
        currentCalendarDate = new Date(year, month - 1, 1);
        renderCalendar();
    };

    const monthLabel = document.createElement('h3');
    monthLabel.textContent = currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '›';
    nextBtn.onclick = (e) => {
        e.stopPropagation();
        currentCalendarDate = new Date(year, month + 1, 1);
        renderCalendar();
    };

    header.appendChild(prevBtn);
    header.appendChild(monthLabel);
    header.appendChild(nextBtn);
    datePicker.appendChild(header);

    // Create calendar grid
    const calendar = document.createElement('div');
    calendar.className = 'date-picker-calendar';

    // Day labels
    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    dayLabels.forEach(label => {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'date-picker-day-label';
        dayLabel.textContent = label;
        calendar.appendChild(dayLabel);
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'date-picker-day disabled';
        calendar.appendChild(emptyDay);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'date-picker-day';
        dayElement.textContent = day;

        const currentDate = new Date(year, month, day);
        currentDate.setHours(0, 0, 0, 0);

        // Check if today
        if (currentDate.getTime() === today.getTime()) {
            dayElement.classList.add('today');
        }

        // Check if disabled (past dates)
        if (currentDate < today) {
            dayElement.classList.add('disabled');
        } else {
            // Check if selected
            if (selectedStartDate && currentDate.getTime() === selectedStartDate.getTime()) {
                dayElement.classList.add('selected');
            } else if (selectedEndDate && currentDate.getTime() === selectedEndDate.getTime()) {
                dayElement.classList.add('selected');
            } else if (selectedStartDate && selectedEndDate &&
                       currentDate > selectedStartDate && currentDate < selectedEndDate) {
                dayElement.classList.add('in-range');
            }

            // Add click handler
            dayElement.onclick = (e) => {
                e.stopPropagation();
                selectDate(currentDate);
            };
        }

        calendar.appendChild(dayElement);
    }

    datePicker.appendChild(calendar);

    // Create footer
    const footer = document.createElement('div');
    footer.className = 'date-picker-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = (e) => {
        e.stopPropagation();
        selectedStartDate = null;
        selectedEndDate = null;
        selectingEndDate = false;
        hideDatePicker();
    };

    const applyBtn = document.createElement('button');
    applyBtn.className = 'apply-btn';
    applyBtn.textContent = 'Apply';
    applyBtn.disabled = !selectedStartDate || !selectedEndDate;
    applyBtn.onclick = (e) => {
        e.stopPropagation();
        applyDateRange();
    };

    footer.appendChild(cancelBtn);
    footer.appendChild(applyBtn);
    datePicker.appendChild(footer);
}

/**
 * Select a date
 */
function selectDate(date) {
    if (!selectingEndDate) {
        // Selecting start date
        selectedStartDate = date;
        selectedEndDate = null;
        selectingEndDate = true;
    } else {
        // Selecting end date
        if (date >= selectedStartDate) {
            selectedEndDate = date;
            selectingEndDate = false;
        } else {
            // If selected date is before start, make it the new start
            selectedStartDate = date;
            selectedEndDate = null;
        }
    }

    // Re-render calendar
    renderCalendar();
}

/**
 * Apply selected date range
 */
function applyDateRange() {
    if (!selectedStartDate || !selectedEndDate) return;

    // Update trip metadata
    tripMetadata.startDate = selectedStartDate;
    tripMetadata.endDate = selectedEndDate;

    // Format date range for display with abbreviated format
    const startStr = formatDateAbbreviated(selectedStartDate);
    const endStr = formatDateAbbreviated(selectedEndDate);
    tripMetadata.schedule = `${startStr} - ${endStr}`;

    // Update button text
    const scheduleBtn = document.getElementById('scheduleBtn');
    if (scheduleBtn) {
        scheduleBtn.textContent = tripMetadata.schedule;
    }

    // Trigger callback if defined
    if (window.onScheduleChanged) {
        window.onScheduleChanged(tripMetadata.startDate, tripMetadata.endDate);
    }

    // Hide date picker
    hideDatePicker();
}

/**
 * Format date as abbreviated format (e.g., "Mon, Dec 25")
 */
function formatDateAbbreviated(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();

    return `${dayName}, ${monthName} ${day}`;
}

/**
 * Render city cards
 */
function renderCityCards() {
    const container = document.getElementById('cityCardsContainer');
    if (!container) return;

    // Clear existing cards
    container.innerHTML = '';

    // Create a card for each city
    tripMetadata.cities.forEach((city, index) => {
        const card = document.createElement('div');
        card.className = 'city-card';
        card.draggable = true;
        card.dataset.index = index;

        // City name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'city-card-name';
        nameSpan.textContent = city.name;

        // Remove button (X)
        const removeBtn = document.createElement('button');
        removeBtn.className = 'city-card-remove';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            removeCity(index);
        };

        // Drag and drop event handlers
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragleave', handleDragLeave);

        card.appendChild(nameSpan);
        card.appendChild(removeBtn);
        container.appendChild(card);
    });

    // Update City button text
    updateCityButtonText();
}

/**
 * Update City button text based on number of cities
 */
function updateCityButtonText() {
    const cityBtn = document.getElementById('cityBtn');
    if (!cityBtn) return;

    const numCities = tripMetadata.cities.length;

    if (numCities === 0) {
        cityBtn.textContent = 'City';
    } else if (numCities === 1) {
        cityBtn.textContent = tripMetadata.cities[0].name;
    } else {
        cityBtn.textContent = `${numCities} cities`;
    }
}

/**
 * Remove city from the list
 */
function removeCity(index) {
    tripMetadata.cities.splice(index, 1);
    renderCityCards();

    // Trigger callback if defined
    if (window.onCityChanged) {
        window.onCityChanged(tripMetadata.cities);
    }
}

/**
 * Drag and drop handlers
 */
function handleDragStart(e) {
    draggedCityIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    // Remove drag-over class from all cards
    document.querySelectorAll('.city-card').forEach(card => {
        card.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const targetCard = e.target.closest('.city-card');
    if (targetCard && !targetCard.classList.contains('dragging')) {
        targetCard.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const targetCard = e.target.closest('.city-card');
    if (targetCard) {
        targetCard.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const targetCard = e.target.closest('.city-card');
    if (!targetCard) return;

    const targetIndex = parseInt(targetCard.dataset.index);

    if (draggedCityIndex !== null && draggedCityIndex !== targetIndex) {
        // Reorder cities array
        const draggedCity = tripMetadata.cities[draggedCityIndex];
        tripMetadata.cities.splice(draggedCityIndex, 1);
        tripMetadata.cities.splice(targetIndex, 0, draggedCity);

        // Re-render cards
        renderCityCards();

        // Trigger callback if defined
        if (window.onCityChanged) {
            window.onCityChanged(tripMetadata.cities);
        }
    }

    draggedCityIndex = null;
}

/**
 * Get current trip metadata
 */
function getTripMetadata() {
    return tripMetadata;
}

/**
 * Update trip metadata from external source (e.g., chat agent)
 */
function updateTripMetadata(data) {
    if (data.city) {
        tripMetadata.city = data.city;
        const cityInput = document.getElementById('cityInput');
        if (cityInput) {
            cityInput.value = data.city;
        }
    }

    if (data.schedule) {
        tripMetadata.schedule = data.schedule;
        const scheduleInput = document.getElementById('scheduleInput');
        if (scheduleInput) {
            scheduleInput.value = data.schedule;
        }
    }
}
