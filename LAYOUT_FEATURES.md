# TripRoute Layout Features

## 🎨 Resizable Layout

The TripRoute interface now features **adjustable panels** with drag-to-resize functionality!

## Features

### 1. Vertical Splitter (Left ↔ Right)
**Location:** Between the map section and recommendations/chat section

**How to use:**
1. Hover over the thin bar between left and right sides
2. Bar highlights in **blue** when you hover
3. Click and drag left or right to resize
4. **Minimum width:** 300px on each side

**Visual feedback:**
- Gray bar normally
- Blue on hover
- Dark blue when dragging
- Cursor changes to `↔` (col-resize)

### 2. Horizontal Splitter (Top ↔ Bottom)
**Location:** Between "Suggestions For You" and "Travel Agent" chat

**How to use:**
1. Hover over the thin bar between the two sections
2. Bar highlights in **blue** when you hover
3. Click and drag up or down to resize
4. **Minimum height:** 200px on each section

**Visual feedback:**
- Gray bar normally
- Blue on hover
- Dark blue when dragging
- Cursor changes to `↕` (row-resize)

## Summary Boxes

Now showing **3 boxes** instead of 4:

1. **🚗 Car ETA** - Shows driving time and distance
2. **🚌 Transit ETA** - Shows public transit information
3. **🖨️ Print Itinerary** - Print detailed route

**Removed:**
- ❌ Export to Google Maps button (removed as requested)

## Layout Presets

### Default Layout:
- Left (Map): ~60% width
- Right (Places + Chat): ~40% width
- Places: ~35% height
- Chat: ~65% height

### Recommended Configurations:

**Focus on Map:**
- Drag right splitter → resize right column to ~30%
- Great for viewing full route details

**Focus on Chat:**
- Drag horizontal splitter → make chat section larger
- Great for longer conversations with AI

**Balanced View:**
- Default layout works well for most use cases
- Equal focus on map, recommendations, and chat

## Keyboard Support

Currently, resizing is mouse-only. The splitters are:
- Accessible via mouse drag
- Minimum size constraints prevent content from being hidden
- Smooth, real-time resizing

## Technical Details

### CSS Classes:
- `.vertical-splitter` - Left-right resize bar
- `.horizontal-splitter` - Top-bottom resize bar
- `.dragging` - Applied during active drag

### JavaScript:
- `initResizers()` - Initializes all resize functionality
- Mouse events: `mousedown`, `mousemove`, `mouseup`
- Real-time flex/width adjustments

### Constraints:
- **Minimum column width:** 300px
- **Minimum section height:** 200px
- **Splitter width:** 8px (clickable area)
- **Visual indicator:** 3px bar (expands on hover/drag)

## Browser Compatibility

✅ Works on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Tips

1. **Save your layout:** Browser remembers sizes during session
2. **Reset layout:** Refresh page to return to defaults
3. **Smooth dragging:** Move mouse slowly for precise control
4. **Visual feedback:** Watch for blue highlight to know you're on splitter

## Future Enhancements

Potential additions:
- [ ] Save layout preferences to localStorage
- [ ] Keyboard shortcuts for resizing
- [ ] Double-click to reset to default
- [ ] Layout presets (compact, expanded, balanced)
- [ ] Touch support for mobile/tablet

## Troubleshooting

**Splitter not visible?**
- Hover slowly over the gap between sections
- Look for gray bar to appear

**Can't drag?**
- Make sure you're clicking on the splitter bar
- Cursor should change to resize icon

**Sections won't resize?**
- Check minimum size constraints (300px/200px)
- Try refreshing the page

**Resizing feels jumpy?**
- This is normal, browser reflows the layout
- Drag slower for smoother experience
