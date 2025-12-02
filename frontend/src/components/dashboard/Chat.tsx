/**
 * Chat Component - Phase 1
 * Handles chat interface with streaming responses from Dashboard backend
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { initChat, streamChatMessage, type ChatStreamEvent, type PlaceData } from '../../services/dashboardApi'
import './Chat.css'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatProps {
  onPlaceReceived?: (place: PlaceData) => void
  onTripContextReceived?: (context: any) => void
  onSessionReady?: (sessionId: string) => void
}

export function Chat({ onPlaceReceived, onTripContextReceived, onSessionReady }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [enrichedPlaces, setEnrichedPlaces] = useState<Record<string, PlaceData>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Initialize chat session
  useEffect(() => {
    let mounted = true

    async function initialize() {
      try {
        const response = await initChat()
        if (mounted) {
          setSessionId(response.session_id)
          setIsConnected(true)
          
          // Notify parent component of session ID
          if (onSessionReady) {
            onSessionReady(response.session_id)
          }
          
          // Add welcome message
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: response.welcome_message,
            timestamp: new Date()
          }])
        }
      } catch (error) {
        console.error('[Chat] Failed to initialize:', error)
        if (mounted) {
          setIsConnected(false)
          setMessages([{
            id: 'error',
            role: 'assistant',
            content: 'Failed to connect to server. Please refresh the page.',
            timestamp: new Date()
          }])
        }
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [onSessionReady])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [inputValue])

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading || !sessionId) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    // Add user message
    setMessages(prev => [...prev, userMessage])
    const messageToSend = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    try {
      // Start streaming response
      let assistantMessageId = (Date.now() + 1).toString()
      let currentContent = ''
      let loadingMessageAdded = false

      for await (const event of streamChatMessage(sessionId, messageToSend)) {
        if (event.type === 'text_chunk') {
          if (!loadingMessageAdded) {
            // Remove loading indicator if exists
            setMessages(prev => prev.filter(m => m.id !== 'loading'))
            loadingMessageAdded = true
          }

          currentContent = event.content || ''
          
          // Update or create assistant message
          setMessages(prev => {
            const existing = prev.find(m => m.id === assistantMessageId)
            if (existing) {
              return prev.map(m => 
                m.id === assistantMessageId 
                  ? { ...m, content: currentContent }
                  : m
              )
            } else {
              return [...prev, {
                id: assistantMessageId,
                role: 'assistant',
                content: currentContent,
                timestamp: new Date()
              }]
            }
          })
        } else if (event.type === 'text_complete') {
          // Finalize message
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId 
              ? { ...m, content: event.content || currentContent }
              : m
          ))
        } else if (event.type === 'marker' && event.placeId) {
          // Handle place marker - store enriched place
          const placeData: PlaceData = {
            placeId: event.placeId,
            displayName: event.displayName || '',
            formattedAddress: event.formattedAddress,
            rating: event.rating,
            userRatingCount: event.userRatingCount,
            location: event.location ? {
              latitude: event.location.latitude || 0,
              longitude: event.location.longitude || 0
            } : undefined,
            ...event
          }

          // Store place
          setEnrichedPlaces(prev => ({
            ...prev,
            [event.displayName || '']: placeData,
            [event.originalDisplayName || '']: placeData
          }))

          // Notify parent component
          if (onPlaceReceived) {
            onPlaceReceived(placeData)
          }
        } else if (event.type === 'trip_context' && event.trip_context) {
          // Handle trip context
          if (onTripContextReceived) {
            onTripContextReceived(event.trip_context)
          }
        } else if (event.type === 'error') {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Error: ${event.message || 'An error occurred'}`,
            timestamp: new Date()
          }])
        }
      }
    } catch (error) {
      console.error('[Chat] Error sending message:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, sessionId, onPlaceReceived, onTripContextReceived])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="dashboard-chat">
      <div className="chat-messages" id="chatMessages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-content">
              {message.role === 'assistant' ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="loading" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Ask for travel recommendations..." : "Connecting..."}
            disabled={!isConnected || isLoading}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || isLoading || !inputValue.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

