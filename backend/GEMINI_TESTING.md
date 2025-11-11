# Gemini vs OpenAI Performance Testing Guide

## Setup

### 1. Install Required Package
```bash
pip install google-generativeai
```

### 2. Get Gemini API Key
1. Go to https://aistudio.google.com/apikey
2. Create a new API key
3. Copy the key and add it to `backend/api.env`:
   ```
   GEMINI_API_KEY=your_actual_key_here
   ```

## Testing

### Run OpenAI Version (Current)
```bash
python backend/chatgpt.py
```

### Run Gemini Version (New with Grounding)
```bash
python backend/gemini.py
```

## Performance Comparison Test

Use the same input for both versions:

**Test Query:**
```
Toronto, Friday morning to Sunday night, try the best ice cream scoop shops as many as possible and if there is sightseeing that I should not miss on my way, recommend attractions. I have a car.
```

### Metrics to Compare

1. **Response Time**: Measure from input to first recommendation
2. **Total Time**: Full conversation to final output
3. **Recommendation Quality**: Check if ratings/reviews are current
4. **Output Format**: Both should produce identical `triproute_recommendations.json`

### Expected Results

| Metric | OpenAI (web_search) | Gemini (grounding) |
|--------|---------------------|-------------------|
| First response | 10-30+ seconds | 1-2 seconds |
| Recommendation quality | Current | Current |
| Citations | Manual | Automatic |
| Cost per request | ~$0.015 | ~$0.002 |

## Key Differences

### OpenAI Version (`chatgpt.py`)
- Uses `gpt-5-mini` with `web_search` tool
- Sequential: decide → search → read → respond
- Slower but familiar

### Gemini Version (`gemini.py`)
- Uses `gemini-2.0-flash-exp` with `google_search_retrieval`
- Parallel: search + generate simultaneously
- **Google Search grounding** for real-time data
- Much faster response time

## Batch Testing

To test multiple queries in batch:

```python
test_queries = [
    "Toronto, ice cream shops, 2 days",
    "New York, museums, 3 days, transit",
    "San Francisco, hiking trails, weekend"
]

import time

for query in test_queries:
    start = time.time()
    # Run either chatgpt.py or gemini.py
    elapsed = time.time() - start
    print(f"Query: {query[:30]}... - Time: {elapsed:.2f}s")
```

## Notes

- Both versions output to `backend/triproute_recommendations.json`
- The `optimization.py` step works with both (unchanged)
- Gemini grounding uses Google's direct search index (faster than web scraping)
- You can run both versions back-to-back to compare outputs

## Recommendation

If Gemini's speed meets your needs and recommendations are accurate:
- Replace `chatgpt.py` with `gemini.py`
- Single ecosystem (Gemini + Google Maps)
- Much faster user experience
