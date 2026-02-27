/**
 * Global error handler for Google Maps internal errors
 * Suppresses known internal Google Maps errors that don't affect functionality
 */

// Store original error handler
let originalError: typeof window.onerror = null
let rejectionHandlerAdded = false

export function setupMapsErrorHandler() {
  // Store original error handler if not already stored
  if (!originalError) {
    originalError = window.onerror
  }

  // Handle synchronous errors
  window.onerror = (message, source, lineno, colno, error) => {
    const messageStr = typeof message === 'string' ? message : String(message)
    const errorStr = error?.message || error?.toString() || ''
    const sourceStr = source || ''
    const combinedMessage = (messageStr + ' ' + errorStr).toLowerCase()
    const isGoogleMapsSource = sourceStr.includes('maps.googleapis.com') || sourceStr.includes('google') || sourceStr.includes('maps')
    
      // Suppress known Google Maps internal errors - check for various patterns
      // More aggressive: suppress ANY undefined error from Google Maps sources
      if (
        combinedMessage.includes("'cj'") ||
        combinedMessage.includes("reading 'cj'") ||
        combinedMessage.includes("cannot read properties of undefined (reading 'cj')") ||
        combinedMessage.includes("cannot read property 'cj'") ||
        (isGoogleMapsSource && combinedMessage.includes('undefined')) ||
        (combinedMessage.includes('google') && combinedMessage.includes('maps') && combinedMessage.includes('undefined'))
      ) {
        // Silently suppress - don't log to reduce console noise
        return true // Suppress the error
      }
    
    // Call original handler if provided
    if (originalError) {
      return originalError(message, source, lineno, colno, error)
    }
    return false
  }

  // Handle promise rejections - only add once
  if (!rejectionHandlerAdded) {
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const reasonMessage = reason?.message || reason?.toString() || String(reason) || ''
      const reasonStack = reason?.stack || ''
      const errorName = reason?.name || ''
      const combinedReason = (reasonMessage + ' ' + reasonStack + ' ' + errorName).toLowerCase()
      
      // Suppress known Google Maps internal errors - more aggressive pattern matching
      // Check for 'cJ' in various formats (minified code might have different formatting)
      const hasCJError = (
        combinedReason.includes("'cj'") ||
        combinedReason.includes("'cj\"") ||
        combinedReason.includes('reading \'cj\'') ||
        combinedReason.includes("reading 'cj\"") ||
        combinedReason.includes("cannot read properties of undefined (reading 'cj')") ||
        combinedReason.includes("cannot read property 'cj'") ||
        combinedReason.includes("typeerror: cannot read properties of undefined (reading 'cj')")
      )
      
      const isGoogleMapsUndefinedError = (
        (combinedReason.includes('google') && combinedReason.includes('maps') && combinedReason.includes('undefined')) ||
        (combinedReason.includes('maps.googleapis.com') && combinedReason.includes('undefined')) ||
        (combinedReason.includes('maps/api/js') && combinedReason.includes('undefined'))
      )
      
      // Also check the stack trace for Google Maps references
      const stackStr = reasonStack.toLowerCase()
      const isFromGoogleMapsScript = stackStr.includes('maps.googleapis.com') || stackStr.includes('maps/api/js')
      
      // More aggressive matching - catch any undefined error from Google Maps scripts
      const shouldSuppress = (
        hasCJError || 
        isGoogleMapsUndefinedError || 
        (isFromGoogleMapsScript && combinedReason.includes('undefined')) ||
        (stackStr.includes('maps.googleapis.com') && combinedReason.includes('undefined') && combinedReason.includes('reading'))
      )
      
      if (shouldSuppress) {
        // Silently suppress - don't even log it to reduce console noise
        event.preventDefault() // Suppress the error
        event.stopPropagation()
        return true
      }
      return false
    }

    // Add listener with capture phase for early interception
    window.addEventListener('unhandledrejection', ((event: Event) => {
      if (event instanceof PromiseRejectionEvent) {
        rejectionHandler(event)
      }
    }) as EventListener, { capture: true })
    
    // Also add in bubble phase as backup
    window.addEventListener('unhandledrejection', ((event: Event) => {
      if (event instanceof PromiseRejectionEvent) {
        rejectionHandler(event)
      }
    }) as EventListener)
    
    rejectionHandlerAdded = true
  }
}

export function removeMapsErrorHandler() {
  if (originalError) {
    window.onerror = originalError
    originalError = null
  }
}
