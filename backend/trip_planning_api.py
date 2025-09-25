from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from chatgpt_JSON import chat_reply_streaming, structure_reply, TripRouteRecommendations
from pydantic import BaseModel, ValidationError
from typing import List, Optional

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

class TripDetails(BaseModel):
    cities: List[str]
    dates: str
    duration: str
    theme: str
    transport: str
    additionalDetails: str

class ChatRequest(BaseModel):
    message: str
    tripDetails: Optional[TripDetails] = None

class ChatResponse(BaseModel):
    message: str
    recommendations: Optional[List[str]] = None
    structuredData: Optional[dict] = None
    error: Optional[str] = None

# Store conversation state (in production, use Redis or database)
conversation_states = {}

@app.route('/api/trip-planning/chat', methods=['POST'])
def chat_with_trip_planning():
    """
    Handle chat messages with structured trip planning
    """
    try:
        data = request.get_json()
        chat_request = ChatRequest(**data)
        
        # Get or create conversation state
        session_id = request.headers.get('X-Session-ID', 'default')
        if session_id not in conversation_states:
            conversation_states[session_id] = {
                'trip_details': chat_request.tripDetails,
                'conversation_history': []
            }
        
        # If trip details are provided, initialize the conversation
        if chat_request.tripDetails and not conversation_states[session_id]['conversation_history']:
            # Initialize with trip details
            initial_message = f"""Hi! I'm your travel agent. I can see you're planning to visit {', '.join(chat_request.tripDetails.cities)} from {chat_request.tripDetails.dates} for {chat_request.tripDetails.duration}. Your theme is {chat_request.tripDetails.theme} and you'll be getting around by {chat_request.tripDetails.transport}. {f"Additional details: {chat_request.tripDetails.additionalDetails}" if chat_request.tripDetails.additionalDetails else ""} Let me help you plan the perfect trip!"""
            
            conversation_states[session_id]['conversation_history'].append({
                'role': 'assistant',
                'content': initial_message
            })
        
        # Get chat response using the structured system
        response_text = chat_reply_streaming(chat_request.message)
        
        # Get structured response
        try:
            structured_response = structure_reply(chat_request.message, response_text)
            structured_data = json.loads(structured_response) if structured_response else None
        except Exception as e:
            print(f"Error getting structured response: {e}")
            structured_data = None
        
        # Extract recommendations from response
        recommendations = extract_recommendations(response_text)
        
        # Store conversation
        conversation_states[session_id]['conversation_history'].extend([
            {'role': 'user', 'content': chat_request.message},
            {'role': 'assistant', 'content': response_text}
        ])
        
        return jsonify(ChatResponse(
            message=response_text,
            recommendations=recommendations,
            structuredData=structured_data
        ).dict())
        
    except ValidationError as e:
        return jsonify(ChatResponse(
            message="Invalid request format",
            error=str(e)
        ).dict()), 400
        
    except Exception as e:
        return jsonify(ChatResponse(
            message="Internal server error",
            error=str(e)
        ).dict()), 500

@app.route('/api/trip-planning/initialize', methods=['POST'])
def initialize_trip_planning():
    """
    Initialize trip planning with user details
    """
    try:
        data = request.get_json()
        trip_details = TripDetails(**data)
        
        session_id = request.headers.get('X-Session-ID', 'default')
        conversation_states[session_id] = {
            'trip_details': trip_details,
            'conversation_history': []
        }
        
        return jsonify({
            'status': 'success',
            'message': 'Trip planning initialized successfully'
        })
        
    except ValidationError as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 400
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/api/trip-planning/status', methods=['GET'])
def get_trip_planning_status():
    """
    Get current trip planning status
    """
    session_id = request.headers.get('X-Session-ID', 'default')
    
    if session_id not in conversation_states:
        return jsonify({
            'status': 'not_initialized',
            'trip_details': None,
            'conversation_count': 0
        })
    
    state = conversation_states[session_id]
    return jsonify({
        'status': 'active',
        'trip_details': state['trip_details'].dict() if state['trip_details'] else None,
        'conversation_count': len(state['conversation_history'])
    })

def extract_recommendations(text: str) -> List[str]:
    """
    Extract recommendations from AI response text
    """
    recommendations = []
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        
        # Look for various patterns that indicate recommendations
        if (line.startswith('•') or line.startswith('-') or line.startswith('*') or
            line.startswith('1.') or line.startswith('2.') or line.startswith('3.') or
            ' - ' in line and len(line) > 10):
            
            # Clean up the line
            clean_line = line
            for prefix in ['•', '-', '*', '1.', '2.', '3.', '4.', '5.']:
                if clean_line.startswith(prefix):
                    clean_line = clean_line[len(prefix):].strip()
                    break
            
            if clean_line and len(clean_line) > 10 and 'http' not in clean_line:
                recommendations.append(clean_line)
    
    return recommendations[:5]  # Limit to 5 recommendations

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'service': 'trip-planning-api'
    })

if __name__ == '__main__':
    print("Starting Trip Planning API server...")
    print("Available endpoints:")
    print("  POST /api/trip-planning/chat - Chat with structured trip planning")
    print("  POST /api/trip-planning/initialize - Initialize trip planning")
    print("  GET /api/trip-planning/status - Get trip planning status")
    print("  GET /health - Health check")
    
    app.run(host='0.0.0.0', port=5001, debug=True)



