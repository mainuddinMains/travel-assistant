// ChatGPT API Integration Service
// This will be implemented by your teammate

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  message: string
  recommendations?: string[]
  error?: string
  structuredData?: TripRouteRecommendations | null
}

export interface TripDetails {
  cities: string[]
  dates: string
  duration: string
  theme: string
  transport: string
  additionalDetails: string
}

export interface PartialTripDetails {
  cities?: string[]
  dates?: string
  duration?: string
  theme?: string
  transport?: string
  additionalDetails?: string
}

export interface QuestionState {
  currentQuestion: number
  answers: PartialTripDetails
  isComplete: boolean
}

export interface RecommendationItem {
  name: string
  address: string
  city: string
  reason: string
}

export interface TripRouteRecommendations {
  trip_meta: {
    cities: string[]
    dates: string
    duration_days: string
    theme: string
    transport: string
  }
  recommendations: RecommendationItem[]
}

class ChatGPTService {
  private apiKey: string | null = null
  private baseUrl = 'https://api.openai.com/v1/chat/completions'
  private backendUrl = 'http://localhost:5001/api/trip-planning'
  private chatMessages: ChatMessage[] = []
  private jsonMessages: ChatMessage[] = []
  private useBackend = false
  private questionState: QuestionState = {
    currentQuestion: 0,
    answers: {},
    isComplete: false
  }

  private readonly CHAT_SYSTEM = `You are TripRoute Chat, a friendly routing assistant.

GOAL
- Help the user provide: (1) cities, (2) dates and duration, (3) trip theme, (4) transport preference, (5) any details (budget/pace).
- Your role is to limit to provide the best personalized recommendations, add/remove a place, and revise the recommendations.
- All your conversations will be passed to TripRoute Extractor to generate a recommendation list for an optimal route in JSON, but that's not your role.

HARD RULES:
- Produce a concise recommendation list with a exact name, address, brief reason why you recommend of the place when recommending places.
- Do not provide places' hyperlinks or URLs before the user wants
- Recommend must-go places or top-rated places with many reviews in the Google Maps Reviews.
- All the recommendations need very sound and solid reasons.

STYLE
- If you don't think you can personalize the recommendations well, ask the user more questions.
- Be concise when recommending places (name, address, reason why you recommend).
- Offer tiny examples ("Seoul → Busan", "3 days", "waling/transit/driving", "ice cream & cafés").
- When the user asks to add/remove/pin, acknowledge and proceed.
- If dates are missing, assume a typical 2-3 day plan on weekend; if times are missing, assume 9:00-21:00.
- Take the open and closed hours into accounts when recommending places.

IMPORTANT
- This channel is user-facing text only. Do not output JSON here.`

  private readonly STRUCTURE_SYSTEM = `You are TripRoute Summarizer.

Your role is to analyze the full conversation between TripRoute Chat and the user and then produce a structured summary of the *final state* of the trip recommendations.

Rules:
- Output must be STRICT structured output that conforms to TripRouteRecommendations.
- Focus on the most recent recommendations given by TripRoute Chat. If the user removed, changed, or added places later, only reflect the final version if earlier recommendations were overridden or updated, exclude them.
- Include metadata about the trip (cities, dates, duration, theme, transport, details) using the most up-to-date information.
- For each recommended place, include:
  - exact name
  - address
  - city
  - brief reason for recommendation (as phrased in the conversation, e.g., "top-rated ice cream shop with many reviews").
- Do not invent new places unless TripRoute Chat explicitly recommended them.
- If the conversation is incomplete (e.g., no recommendations yet), return an empty \`recommendations\` list.`

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  setUseBackend(useBackend: boolean) {
    this.useBackend = useBackend
  }

  // Question flow system
  private readonly QUESTIONS = [
    {
      id: 'cities',
      question: "Hi! I'm your travel agent. Let's plan your perfect trip! First, which cities are you planning to visit?",
      examples: "e.g., Toronto, Montreal, Vancouver"
    },
    {
      id: 'dates',
      question: "Great! When are you planning to travel?",
      examples: "e.g., March 15-18, 2024, Next weekend, Summer vacation"
    },
    {
      id: 'duration',
      question: "Perfect! How long will your trip be?",
      examples: "e.g., 3 days, 1 week, Long weekend"
    },
    {
      id: 'theme',
      question: "Excellent! What's the main theme or focus of your trip?",
      examples: "e.g., Food & dessert tour, Cultural attractions, Nature & hiking, Shopping"
    },
    {
      id: 'transport',
      question: "Nice choice! How do you prefer to get around during your trip?",
      examples: "e.g., Walking & public transit, Driving, Cycling, Mix of all"
    },
    {
      id: 'additionalDetails',
      question: "Almost done! Any other details that would help me personalize your recommendations?",
      examples: "e.g., Budget-friendly options, Relaxed pace, Family-friendly activities, Special dietary needs"
    }
  ]

  private getCurrentQuestion() {
    if (this.questionState.currentQuestion >= this.QUESTIONS.length) {
      return null
    }
    return this.QUESTIONS[this.questionState.currentQuestion]
  }

  private processAnswer(questionId: string, answer: string): string {
    // Store the answer
    if (questionId === 'cities') {
      this.questionState.answers.cities = answer.split(',').map(c => c.trim())
    } else {
      (this.questionState.answers as any)[questionId] = answer
    }
    
    // Move to next question
    this.questionState.currentQuestion++
    
    // Check if all questions are answered
    if (this.questionState.currentQuestion >= this.QUESTIONS.length) {
      this.questionState.isComplete = true
      return this.generateTripSummary()
    }
    
    // Return next question
    const nextQuestion = this.getCurrentQuestion()
    return nextQuestion ? `${nextQuestion.question}\n\n*Examples: ${nextQuestion.examples}*` : ""
  }

  private generateTripSummary(): string {
    const answers = this.questionState.answers
    return `Perfect! I have all the details I need. Let me summarize your trip:

🏙️ **Cities**: ${answers.cities || 'Not specified'}
📅 **Dates**: ${answers.dates || 'Not specified'}
⏱️ **Duration**: ${answers.duration || 'Not specified'}
🎯 **Theme**: ${answers.theme || 'Not specified'}
🚗 **Transport**: ${answers.transport || 'Not specified'}
📝 **Additional Details**: ${answers.additionalDetails || 'None'}

Now I'm ready to help you plan the perfect trip! What would you like to know about your destinations? I can recommend specific places, help with routes, or answer any questions about your trip.`
  }

  getQuestionState(): QuestionState {
    return { ...this.questionState }
  }

  resetQuestionState() {
    this.questionState = {
      currentQuestion: 0,
      answers: {},
      isComplete: false
    }
  }

  // Initialize conversation with trip details
  initializeWithTripDetails(tripDetails: TripDetails) {
    const initialMessage = `Hi! I'm your travel agent. I can see you're planning to visit ${tripDetails.cities.join(', ')} from ${tripDetails.dates} for ${tripDetails.duration}. Your theme is ${tripDetails.theme} and you'll be getting around by ${tripDetails.transport}. ${tripDetails.additionalDetails ? `Additional details: ${tripDetails.additionalDetails}` : ''} Let me help you plan the perfect trip!`
    
    this.chatMessages = [
      { role: 'system', content: this.CHAT_SYSTEM },
      { role: 'assistant', content: initialMessage }
    ]
    
    this.jsonMessages = [
      { role: 'system', content: this.STRUCTURE_SYSTEM }
    ]
  }

  // Send message using the structured conversation system
  async sendStructuredMessage(userText: string): Promise<ChatResponse> {
    // Try backend API first if enabled
    if (this.useBackend) {
      try {
        return await this.sendStructuredMessageBackend(userText)
      } catch (error) {
        console.warn('Backend API failed, falling back to direct API:', error)
      }
    }

    if (!this.apiKey || this.apiKey === 'your_chatgpt_api_key_here') {
      console.warn('ChatGPT API key not configured, using mock service')
      return this.sendStructuredMessageMock(userText)
    }

    try {
      // Add user message to chat conversation
      this.chatMessages.push({ role: 'user', content: userText })
      
      // Get chat response
      const chatResponse = await this.getChatResponse()
      
      // Add assistant response to chat conversation
      this.chatMessages.push({ role: 'assistant', content: chatResponse })
      
      // Get structured response
      const structuredResponse = await this.getStructuredResponse(userText, chatResponse)
      
      return {
        message: chatResponse,
        recommendations: this.extractRecommendations(chatResponse),
        structuredData: structuredResponse
      }
    } catch (error) {
      console.error('Structured ChatGPT API error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return {
        message: `I'm having trouble connecting to the AI service. ${errorMessage}`,
        error: errorMessage
      }
    }
  }

  private async sendStructuredMessageBackend(userText: string): Promise<ChatResponse> {
    const response = await fetch(`${this.backendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': 'frontend-session'
      },
      body: JSON.stringify({
        message: userText,
        tripDetails: this.chatMessages.length > 0 ? null : undefined // Only send trip details on first message
      })
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    return {
      message: data.message,
      recommendations: data.recommendations,
      structuredData: data.structuredData
    }
  }

  private async getChatResponse(): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: this.chatMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private async getStructuredResponse(userText: string, chatResponse: string): Promise<TripRouteRecommendations | null> {
    // Add conversation to JSON messages
    this.jsonMessages.push(
      { role: 'user', content: userText },
      { role: 'assistant', content: chatResponse }
    )

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          ...this.jsonMessages,
          {
            role: 'system',
            content: 'Please analyze the conversation and return a structured JSON response with trip metadata and recommendations.'
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      console.warn('Structured response failed, continuing without it')
      return null
    }

    const data = await response.json()
    try {
      return JSON.parse(data.choices[0].message.content)
    } catch {
      console.warn('Failed to parse structured response')
      return null
    }
  }

  async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    // Handle question flow if not complete
    if (!this.questionState.isComplete) {
      const lastMessage = messages[messages.length - 1]?.content || ''
      const currentQuestion = this.getCurrentQuestion()
      
      if (currentQuestion) {
        // Process the answer and get next question or summary
        const response = this.processAnswer(currentQuestion.id, lastMessage)
        return {
          message: response,
          recommendations: []
        }
      }
    }

    if (!this.apiKey || this.apiKey === 'your_chatgpt_api_key_here') {
      console.warn('ChatGPT API key not configured, using mock service')
      return this.sendMessageMock(messages)
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an expert travel agent and local guide. Your role is to:

1. Provide personalized travel recommendations based on user preferences
2. Suggest specific places, restaurants, attractions, and activities
3. Help plan itineraries and routes
4. Give practical travel tips and local insights
5. Recommend places in this format when suggesting locations: "Place Name - Brief description"

When recommending places, be specific and mention:
- What makes the place unique or special
- Best times to visit
- Local tips or must-try items
- How it fits into their travel plans

Keep responses conversational, helpful, and focused on creating amazing travel experiences.`
            },
            ...messages
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('ChatGPT API error:', response.status, errorData)
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your ChatGPT API key configuration.')
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again in a moment.')
        } else if (response.status === 500) {
          throw new Error('OpenAI server error. Please try again later.')
        } else {
          throw new Error(`API error (${response.status}): ${errorData.error?.message || response.statusText}`)
        }
      }

      const data = await response.json()
      return {
        message: data.choices[0].message.content,
        recommendations: this.extractRecommendations(data.choices[0].message.content)
      }
    } catch (error) {
      console.error('ChatGPT API error:', error)
      
      // Return a more helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return {
        message: `I'm having trouble connecting to the AI service. ${errorMessage}`,
        error: errorMessage
      }
    }
  }

  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = []
    const lines = content.split('\n')
    
    lines.forEach(line => {
      const trimmedLine = line.trim()
      
      // Look for various patterns that indicate recommendations
      if (trimmedLine.match(/^[•\-*]\s/) || // Bullet points
          trimmedLine.match(/^\d+\.\s/) || // Numbered lists
          trimmedLine.match(/^[A-Z][^.!?]* - /) || // Place Name - Description format
          trimmedLine.includes(' - ') && trimmedLine.length > 10) { // Dash-separated recommendations
        
        // Clean up the line
        let clean = trimmedLine
          .replace(/^[•\-*]\s/, '') // Remove bullet points
          .replace(/^\d+\.\s/, '') // Remove numbers
          .trim()
        
        // Only add if it looks like a meaningful recommendation
        if (clean && clean.length > 10 && !clean.includes('http')) {
          recommendations.push(clean)
        }
      }
    })
    
    // Also look for recommendations in the format "Place Name - Description"
    const placePattern = /([A-Z][a-zA-Z\s&']+ - [^.!?\n]+)/g
    const matches = content.match(placePattern)
    if (matches) {
      matches.forEach(match => {
        if (!recommendations.includes(match.trim())) {
          recommendations.push(match.trim())
        }
      })
    }
    
    return recommendations.slice(0, 5) // Limit to 5 recommendations
  }

  // Mock implementation for structured messages
  async sendStructuredMessageMock(userText: string): Promise<ChatResponse> {
    // Simulate the structured conversation flow
    this.chatMessages.push({ role: 'user', content: userText })
    
    let response = ""
    let recommendations: string[] = []
    
    if (userText.toLowerCase().includes('toronto')) {
      response = "Toronto is amazing! I've curated some great dessert spots for you. Check out the recommended places - I can help optimize your route to visit them all efficiently!"
      recommendations = [
        'Ruru Baked - Artisanal bakery with fresh bread and pastries',
        'Bang Bang Ice Cream & Bakery - Creative ice cream flavors',
        'Sweet Jesus - Instagram-worthy ice cream creations'
      ]
    } else if (userText.toLowerCase().includes('dessert') || userText.toLowerCase().includes('sweet')) {
      response = "Perfect! I love helping with dessert tours. Toronto has incredible sweet spots. Let me add some amazing places to your itinerary!"
      recommendations = [
        'Dufflet Pastries - Award-winning cakes and pastries',
        'Bakerbots Baking - Unique ice cream flavors',
        'Bobette & Belle - French-inspired desserts'
      ]
    } else {
      response = "I'd be happy to help you plan your trip! What city are you visiting and what type of places interest you most?"
      recommendations = []
    }
    
    this.chatMessages.push({ role: 'assistant', content: response })
    
    return {
      message: response,
      recommendations,
      structuredData: {
        trip_meta: {
          cities: ['Toronto'],
          dates: 'March 15-18, 2024',
          duration_days: '3 days',
          theme: 'dessert tour',
          transport: 'walking'
        },
        recommendations: recommendations.map(rec => {
          const [name, reason] = rec.split(' - ')
          return {
            name: name.trim(),
            address: 'Toronto, ON',
            city: 'Toronto',
            reason: reason.trim()
          }
        })
      }
    }
  }

  // Mock implementation for development
  async sendMessageMock(messages: ChatMessage[]): Promise<ChatResponse> {
    // Handle question flow if not complete
    if (!this.questionState.isComplete) {
      const lastMessage = messages[messages.length - 1]?.content || ''
      const currentQuestion = this.getCurrentQuestion()
      
      if (currentQuestion) {
        // Process the answer and get next question or summary
        const response = this.processAnswer(currentQuestion.id, lastMessage)
        return {
          message: response,
          recommendations: []
        }
      }
    }

    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || ''
    
    if (lastMessage.includes('toronto')) {
      return {
        message: "Toronto is amazing! I've curated some great dessert spots for you. Check out the recommended places - I can help optimize your route to visit them all efficiently!",
        recommendations: [
          'Ruru Baked - Artisanal bakery with fresh bread and pastries',
          'Bang Bang Ice Cream & Bakery - Creative ice cream flavors',
          'Sweet Jesus - Instagram-worthy ice cream creations'
        ]
      }
    }
    
    if (lastMessage.includes('dessert') || lastMessage.includes('sweet')) {
      return {
        message: "Perfect! I love helping with dessert tours. Toronto has incredible sweet spots. Let me add some amazing places to your itinerary!",
        recommendations: [
          'Dufflet Pastries - Award-winning cakes and pastries',
          'Bakerbots Baking - Unique ice cream flavors',
          'Bobette & Belle - French-inspired desserts'
        ]
      }
    }
    
    return {
      message: "I'd be happy to help you plan your trip! What city are you visiting and what type of places interest you most?",
      recommendations: []
    }
  }
}

export const chatGPTService = new ChatGPTService()
