// Chat agent functionality
const API_BASE_URL = 'http://localhost:8000';
let sessionId = null;
let isStreaming = false;
let enrichedPlacesBuffer = {};  // Store enriched places by name for quick lookup
let previousText = '';  // Track previous text to detect newly appeared place names

// Initialize chat session
async function initChat() {
    console.log('[Chat Agent] Connecting to chat backend...');

    // Disable chat input until connected
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    sendBtn.disabled = true;
    messageInput.disabled = true;
    messageInput.placeholder = 'Connecting to chat...';

    try {
        const response = await fetch(`${API_BASE_URL}/chat/init`, {
            method: 'POST'
        });
        const data = await response.json();
        sessionId = data.session_id;

        console.log('[Chat Agent] ✓ Chatting agent connected');

        // Display welcome message
        addMessage('assistant', data.welcome_message);

        // Enable chat input
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.placeholder = 'Ask for travel recommendations...';
    } catch (error) {
        console.error('[Chat Agent] ✗ Failed to initialize chat:', error);
        addMessage('assistant', 'Failed to connect to server. Please refresh the page.');
        messageInput.placeholder = 'Connection failed. Please refresh.';
    }
}

// Send message and handle streaming response
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message || isStreaming) return;

    // Add user message to chat
    addMessage('user', message);
    input.value = '';

    // Show loading indicator (use special marker to bypass formatting)
    isStreaming = true;
    document.getElementById('sendBtn').disabled = true;
    const loadingMsg = addMessage('assistant', '⏳ Thinking...');

    try {
        const response = await fetch(`${API_BASE_URL}/chat/stream/${sessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantMessage = null;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.slice(6));

                    if (data.type === 'text_chunk') {
                        // Remove loading indicator on first chunk
                        if (loadingMsg && loadingMsg.parentNode) {
                            loadingMsg.remove();
                        }

                        // Update assistant message with streaming text
                        if (!assistantMessage) {
                            assistantMessage = addMessage('assistant', data.content);
                            previousText = data.content;
                        } else {
                            // Update existing message content with hyperlinked text
                            const messageContent = assistantMessage.querySelector('.message-content');

                            // Format text with markdown AND hyperlink place mentions in real-time
                            let formattedContent = formatMessageContent(data.content);
                            formattedContent = hyperlinkPlaceMentions(formattedContent);

                            messageContent.innerHTML = formattedContent;
                            scrollChatToBottom();

                            // Check for newly appeared place names and add markers
                            checkForNewPlaceMentions(data.content, previousText);
                            previousText = data.content;
                        }
                    } else if (data.type === 'text_complete') {
                        // Final text - ensure it's displayed correctly
                        if (assistantMessage) {
                            const messageContent = assistantMessage.querySelector('.message-content');
                            const formattedContent = formatMessageContent(data.content);
                            messageContent.innerHTML = formattedContent;
                            scrollChatToBottom();

                            // Add all buffered markers to map (in case enrichment finished before text complete)
                            addAllBufferedMarkers();

                            // Make all place mentions interactive
                            makeplaceMentionsInteractive(assistantMessage);
                        }
                        previousText = '';  // Reset for next message
                    } else if (data.type === 'trip_context') {
                        // Update trip metadata in UI
                        console.log('[Trip Context] Received:', data.trip_context);
                        updateTripMetadataFromChat(data.trip_context);
                    } else if (data.type === 'marker') {
                        // Store in buffer using BOTH names for text matching
                        // Use official name as primary key
                        enrichedPlacesBuffer[data.name] = data;

                        // Also store by original name if different (for text matching variations)
                        if (data.original_name && data.original_name !== data.name) {
                            enrichedPlacesBuffer[data.original_name] = data;
                        }

                        // Check if this place has already been mentioned in the current text
                        // Check BOTH official name and original name
                        const mentionedAsOfficial = previousText.includes(data.name);
                        const mentionedAsOriginal = data.original_name && previousText.includes(data.original_name);

                        if (mentionedAsOfficial || mentionedAsOriginal) {
                            addMarker(data);
                        }
                    } else if (data.type === 'done') {
                        // Streaming complete - add any remaining markers
                        addAllBufferedMarkers();
                    } else if (data.type === 'error') {
                        console.error('Stream error:', data.message);
                        if (loadingMsg && loadingMsg.parentNode) {
                            loadingMsg.remove();
                        }
                        addMessage('assistant', 'Error: ' + data.message);
                    }
                }
            }
        }

        // Ensure loading message is removed even if no text was received
        if (loadingMsg && loadingMsg.parentNode) {
            loadingMsg.remove();
        }
    } catch (error) {
        console.error('Error sending message:', error);
        if (loadingMsg && loadingMsg.parentNode) {
            loadingMsg.remove();
        }
        addMessage('assistant', 'Sorry, there was an error processing your request.');
    } finally {
        isStreaming = false;
        document.getElementById('sendBtn').disabled = false;
    }
}

// Format message text with markdown-to-HTML conversion using marked.js
function formatMessageContent(text) {
    // Use marked.js to parse Markdown (handles all standard Markdown syntax)
    // marked automatically sanitizes HTML to prevent XSS
    const html = marked.parse(text, {
        breaks: false,  // Don't convert single line breaks to <br> - use standard Markdown (requires blank line for new paragraph)
        gfm: true,     // GitHub Flavored Markdown (supports tables, strikethrough, etc.)
        headerIds: false,  // Don't add IDs to headers
        mangle: false,     // Don't escape email addresses
    });

    return html;
}

// Scroll chat to bottom
function scrollChatToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
}

// Add message to chat
function addMessage(role, content) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    // Format content with markdown-to-HTML conversion
    const formattedContent = formatMessageContent(content);
    messageDiv.innerHTML = `<div class="message-content">${formattedContent}</div>`;

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom after adding message
    scrollChatToBottom();

    return messageDiv;
}

// Add all buffered markers to the map
function addAllBufferedMarkers() {
    for (const placeName in enrichedPlacesBuffer) {
        const placeData = enrichedPlacesBuffer[placeName];
        addMarker(placeData);  // This will check for duplicates internally
    }
}

// Check for newly appeared place names in text and pop markers
function checkForNewPlaceMentions(currentText, previousText) {
    // Get the new text that was added
    const newText = currentText.substring(previousText.length);

    // Check each enriched place to see if it appears in new text OR current text
    for (const placeName in enrichedPlacesBuffer) {
        // Check if this place just appeared in the new text
        if (newText.includes(placeName)) {
            const placeData = enrichedPlacesBuffer[placeName];
            addMarker(placeData);  // This will check for duplicates internally
        }
        // Also check if place appears in current text but we haven't added marker yet
        else if (currentText.includes(placeName) && !displayedPlaceIds.has(enrichedPlacesBuffer[placeName].place_id)) {
            const placeData = enrichedPlacesBuffer[placeName];
            addMarker(placeData);
        }
    }
}

// Hyperlink place mentions in HTML content (for real-time streaming)
function hyperlinkPlaceMentions(htmlContent) {
    let html = htmlContent;

    // Replace each place name with interactive span
    for (const placeName in enrichedPlacesBuffer) {
        const placeData = enrichedPlacesBuffer[placeName];
        if (!placeData) continue;

        // Create regex to match place name (case-insensitive, whole words)
        // Avoid matching if already inside a tag or class attribute
        const regex = new RegExp(`(?<!<[^>]*)\\b(${escapeRegex(placeName)})\\b(?![^<]*>)(?![^<]*class=)`, 'gi');

        // Replace with interactive span - uses unified showPlaceCard from placecard.js
        html = html.replace(regex, (match) => {
            return `<span class="place-link" data-place-id="${placeData.place_id}"
                          onmouseover="showPlaceCardForText(this, '${placeData.place_id}')"
                          onmouseout="handlePlaceLinkMouseOut()"
                          onclick="makeCardStickyFromText('${placeData.place_id}')">${match}</span>`;
        });
    }

    return html;
}

// Make all place mentions interactive after text completes
function makeplaceMentionsInteractive(messageElement) {
    const messageContent = messageElement.querySelector('.message-content');
    const html = hyperlinkPlaceMentions(messageContent.innerHTML);
    messageContent.innerHTML = html;
}

// Escape special regex characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to show place card for text mentions
// This bridges chat.js's enrichedPlacesBuffer with placecard.js's showPlaceCard()
function showPlaceCardForText(element, placeId) {
    const placeData = Object.values(enrichedPlacesBuffer).find(p => p.place_id === placeId);
    if (placeData) {
        showPlaceCard(placeData, element);
    }
}

// Helper function to make card sticky from text click
function makeCardStickyFromText(placeId) {
    // Make the currently displayed card sticky
    makeCardSticky();
}

// Update trip metadata from chat agent
function updateTripMetadataFromChat(tripContext) {
    if (!tripContext) return;

    console.log('[Trip Metadata] Updating from chat:', tripContext);

    // Update cities
    if (tripContext.cities && Array.isArray(tripContext.cities)) {
        // Clear existing cities
        tripMetadata.cities = [];

        // Add cities from chat (without geocoding for now - just add name)
        tripContext.cities.forEach(cityName => {
            // Check if city already exists
            const exists = tripMetadata.cities.some(c => c.name === cityName);
            if (!exists) {
                tripMetadata.cities.push({
                    name: cityName,
                    formatted_address: cityName,
                    location: null,  // Will be geocoded later if needed
                    place_id: null
                });
            }
        });

        // Update UI
        renderCityCards();
        updateCityButtonText();
    }

    // Update schedule dates
    if (tripContext.schedule_start_date && tripContext.schedule_end_date) {
        // Parse ISO date strings correctly (avoid timezone issues)
        // ISO format: YYYY-MM-DD -> parse as local date, not UTC
        const [startYear, startMonth, startDay] = tripContext.schedule_start_date.split('-').map(Number);
        const [endYear, endMonth, endDay] = tripContext.schedule_end_date.split('-').map(Number);

        const startDate = new Date(startYear, startMonth - 1, startDay); // Month is 0-indexed
        const endDate = new Date(endYear, endMonth - 1, endDay);

        // Update trip metadata
        tripMetadata.startDate = startDate;
        tripMetadata.endDate = endDate;
        selectedStartDate = startDate;
        selectedEndDate = endDate;

        // Format date range for display
        const startStr = formatDateAbbreviated(startDate);
        const endStr = formatDateAbbreviated(endDate);
        tripMetadata.schedule = `${startStr} - ${endStr}`;

        // Update button text
        const scheduleBtn = document.getElementById('scheduleBtn');
        if (scheduleBtn) {
            scheduleBtn.textContent = tripMetadata.schedule;
        }

        console.log('[Trip Metadata] Schedule updated:', tripMetadata.schedule);
        console.log('[Trip Metadata] Received dates:', tripContext.schedule_start_date, 'to', tripContext.schedule_end_date);
    }
}

// Setup event listeners for chat
function setupChatEventListeners() {
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    document.getElementById('messageInput').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}
