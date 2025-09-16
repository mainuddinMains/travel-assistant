# Google Maps Loading Troubleshooting Guide

If your Google Maps is stuck on "Loading..." or not displaying, follow these steps to diagnose and fix the issue.

## 🔍 **Step 1: Check Your Environment Configuration**

### 1.1 Create/Update your `.env` file

Create a `.env` file in the `travel-assistant` directory (same level as `package.json`):

```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

**Important**: Replace `your_actual_google_maps_api_key_here` with your real Google Maps API key.

### 1.2 Restart the Development Server

After updating the `.env` file, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## 🔑 **Step 2: Get a Google Maps API Key**

If you don't have a Google Maps API key:

### 2.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "APIs & Services" > "Credentials"

### 2.2 Create API Key
1. Click "Create Credentials" > "API Key"
2. Copy the generated API key
3. (Optional) Restrict the API key to your domain for security

### 2.3 Enable Required APIs
Go to "APIs & Services" > "Library" and enable:
- **Maps JavaScript API**
- **Places API**
- **Directions API**

## 🐛 **Step 3: Debug the Loading Issue**

### 3.1 Check Browser Console

Open your browser's Developer Tools (F12) and check the Console tab for errors:

```javascript
// Look for these error messages:
- "Google Maps API key not configured"
- "Failed to load Google Maps script"
- "Google Maps script loading timeout"
- "Map initialization error"
```

### 3.2 Check Network Tab

In Developer Tools, go to the Network tab and look for:
- Failed requests to `maps.googleapis.com`
- 403 Forbidden errors (usually means API key issue)
- 404 Not Found errors (usually means API not enabled)

### 3.3 Test API Key Manually

Test your API key by visiting this URL in your browser:
```
https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with your actual API key. You should see JavaScript code, not an error.

## 🛠️ **Step 4: Common Solutions**

### 4.1 API Key Issues

**Problem**: "Google Maps API key not configured"
**Solution**: 
- Make sure your `.env` file is in the correct location
- Ensure the API key doesn't have extra spaces or quotes
- Restart the development server after changing `.env`

**Problem**: "Failed to load Google Maps script"
**Solution**:
- Check if your API key is valid
- Verify the required APIs are enabled
- Check your internet connection

### 4.2 API Quota Issues

**Problem**: Map loads but shows error messages
**Solution**:
- Check your Google Cloud Console for quota limits
- Ensure you have billing enabled (required for most APIs)
- Check if you've exceeded daily request limits

### 4.3 Domain Restrictions

**Problem**: Map works in some environments but not others
**Solution**:
- Check if your API key has domain restrictions
- Add `localhost` to allowed domains for development
- Add your production domain for deployment

## 🧪 **Step 5: Test with Simple Example**

Create a simple test file to verify your API key works:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Google Maps Test</title>
</head>
<body>
    <div id="map" style="height: 400px; width: 100%;"></div>
    
    <script>
        function initMap() {
            const map = new google.maps.Map(document.getElementById("map"), {
                center: { lat: 43.6532, lng: -79.3832 },
                zoom: 13,
            });
        }
    </script>
    
    <script async defer
        src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&callback=initMap">
    </script>
</body>
</html>
```

Replace `YOUR_API_KEY_HERE` with your actual API key and open this file in your browser.

## 📱 **Step 6: Check Component Implementation**

### 6.1 Verify Component Import

Make sure you're importing the correct component:

```typescript
import { SimpleGoogleMap } from '../components/SimpleGoogleMap'
```

### 6.2 Check Component Usage

Ensure the component is used correctly:

```typescript
<SimpleGoogleMap
  places={recommendedPlaces}
  onPlaceClick={handlePlaceClick}
  showRoute={showRoute}
  className="w-full h-full min-h-96"
/>
```

### 6.3 Verify Places Data

Make sure you have places data to display:

```typescript
console.log('Recommended places:', recommendedPlaces)
```

## 🚨 **Step 7: Emergency Fallback**

If the map still doesn't work, you can temporarily use a mock map:

```typescript
// In your component, add a fallback
{!isLoaded && (
  <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
    <div className="text-center">
      <h3>🗺️ Map Loading...</h3>
      <p>If this persists, check your Google Maps API key configuration</p>
    </div>
  </div>
)}
```

## 📞 **Step 8: Get Help**

If you're still having issues:

1. **Check the console logs** - The component now includes detailed logging
2. **Verify your API key** - Test it in a simple HTML file
3. **Check Google Cloud Console** - Ensure APIs are enabled and quotas are not exceeded
4. **Restart everything** - Sometimes a fresh start helps

## ✅ **Success Indicators**

Your map is working correctly when you see:
- Interactive Google Maps with zoom/pan controls
- Numbered markers for places
- Clickable markers with info windows
- Route lines when "Show Route" is enabled
- No error messages in the console

## 🔧 **Quick Fix Checklist**

- [ ] `.env` file exists with correct API key
- [ ] Development server restarted after `.env` changes
- [ ] Google Maps JavaScript API enabled
- [ ] Places API enabled
- [ ] Directions API enabled
- [ ] API key has no domain restrictions (for development)
- [ ] Billing enabled in Google Cloud Console
- [ ] No console errors in browser
- [ ] Internet connection is working
- [ ] Places data is being passed to the component


