# Module Selection UI Enhancement - Guide

## Overview

The Module Selection UI has been enhanced with:

- **Real product images** for each module
- **Hover zoom effects** with smooth animations
- **Responsive grid layout** (desktop: 3-4 cards, tablet: 2, mobile: 1)
- **Error handling** with "No Image Available" fallback
- **Loading states** with shimmer skeleton
- **Lazy loading** for performance optimization

---

## 📁 Image Setup

### Directory Structure

```
/images
├── ow-sw-01.png
├── ow-sw-02.png
├── ow-sw-03.png
├── ...
└── Wardrobe_Catalogue_Nirmanbook_*.jpg (existing catalogs)
```

### Naming Convention

**Primary Rule:** Module ID → Image Filename

The system converts module IDs to lowercase filenames:

| Module ID  | Image File     |
| ---------- | -------------- |
| `OW/SW 01` | `ow-sw-01.png` |
| `OW/SW 02` | `ow-sw-02.png` |
| `OW/SW 03` | `ow-sw-03.png` |
| `OW/DW 01` | `ow-dw-01.png` |

**Conversion Rules:**

- Spaces → hyphens (`-`)
- Slashes/backslashes → hyphens (`-`)
- Uppercase → lowercase
- Special characters removed

### Adding Images

1. **Extract or create module images** (preferred formats: PNG, JPEG)
   - Recommended size: ~400-600px wide (images scale down via CSS)
   - Use `object-fit: contain` sizing

2. **Place in `/images` folder** with the correct filename

3. **No additional code needed!** The system will:
   - Auto-detect images by filename
   - Show images in module cards
   - Fall back to "No Image Available" if missing

### Custom Image Mappings (Optional)

If your image filenames differ from the standard convention, edit [src/utils/imageUtils.js](src/utils/imageUtils.js):

```javascript
const CUSTOM_IMAGE_MAP = {
  'OW/SW 01': 'hanging-single-01.png',
  'OW/SW 02': 'hanging-single-02.png',
  'OW/DW 01': 'hanging-double-01.png',
  // Add more mappings as needed
};
```

---

## 🎨 Component Architecture

### ModuleCard.jsx

New component that replaces inline module rendering:

- **Handles image loading** with error states
- **Shimmer animation** during load
- **Hover zoom effect** (1.1x scale)
- **Responsive styling** with media queries
- **Quantity controls** (add/remove buttons)
- **Price & dimensions** display

### StepModules.jsx (Updated)

- Imports `ModuleCard` component
- Removed `ModuleVisual` (replaced by images)
- Uses new responsive grid layout
- Maintains all existing functionality

### index.css (Enhanced)

Added styles for:

- **Shimmer animation** (`@keyframes shimmer`)
- **Hover effects** (smooth scale transitions)
- **Responsive breakpoints** (1200px, 768px, 480px)
- **Module control buttons** with interactive states

---

## 🎯 Visual Features

### Hover Effects

- **Image zoom:** `scale(1.1)` on hover
- **Card lift:** `translateY(-4px)` elevation
- **Shadow increase:** Enhanced drop shadow
- **Smooth transitions:** `0.25s cubic-bezier` easing

### Loading State

- **Shimmer skeleton** while image loads
- Prevents layout shift (fixed container height)
- Smooth fade-in once loaded

### Error Handling

- Shows "No Image Available" placeholder
- Icon + text explanation
- Maintains card layout integrity

### Responsive Grid

```css
Desktop (1200px+):   4 columns, 240px min-width
Tablet (768px):      2 columns, 180px min-width
Mobile (480px):      1 column, full-width
```

---

## 🚀 Usage

### For End Users

1. Browse modules in "Choose Modules" step
2. **Hover** over cards to see:
   - Image zoom effect
   - Smooth elevation
   - Visual feedback
3. **Click +/−** buttons to add/remove quantities
4. See real-time price updates

### For Developers

#### Access Image Utilities

```javascript
import { getModuleImagePath } from '../utils/imageUtils';

const imagePath = getModuleImagePath('OW/SW 01');
// Returns: '/images/ow-sw-01.png'
```

#### Customize Image Sizes

Edit `ModuleCard.jsx` line ~50:

```javascript
<div
  className="module-image-container"
  style={{
    height: '160px',  // ← Adjust this
    // ... other styles
  }}
>
```

---

## ✅ Checklist for Integration

- [x] ModuleCard component created
- [x] Hover zoom effects implemented
- [x] Responsive grid configured
- [x] Error handling in place
- [x] Loading states with shimmer
- [x] Lazy loading enabled
- [ ] **Add module images to `/images` folder**
- [ ] Test hover effects in browser
- [ ] Adjust image container height if needed
- [ ] Verify responsive behavior on mobile
- [ ] Test image fallback by temporarily renaming an image

---

## 🧪 Testing

### Visual Testing

1. Run `npm run dev`
2. Navigate to "Choose Modules" step
3. Observe:
   - Images load (or show fallback)
   - Hover zoom effect works smoothly
   - Cards lift on hover
   - Grid adapts to screen size
   - Mobile: 1 card per row

### Performance Testing

- Check DevTools Network tab
- Images should use `loading="lazy"`
- Verify no Cumulative Layout Shift (CLS)

### Error Scenarios

- Delete an image file temporarily
- Verify "No Image Available" displays
- Add image back → verify auto-reload

---

## 📊 Data Structure

Each module includes:

- `id` - Module identifier (e.g., "OW/SW 01")
- `name` - Display name
- `type` - Module type (hanging, shelf, drawer)
- `width` / `height` / `depth` - Dimensions in mm
- `basePrice` - Price in ₹
- `layout` - Internal structure (hangers, shelves, drawers)

---

## 🎨 Customization

### Change Hover Zoom Level

Edit `ModuleCard.jsx` image style:

```javascript
transform: isHovered ? 'scale(1.12)' : 'scale(1)', // Change 1.12 to desired scale
```

### Adjust Image Container Height

Edit `ModuleCard.jsx`:

```javascript
height: '160px', // Change to 140px, 180px, etc.
```

### Modify Grid Spacing

Edit `StepModules.jsx` grid style:

```javascript
gap: '18px', // Change gap between cards
```

### Change Responsive Breakpoints

Edit `StepModules.jsx` grid media queries or add to `index.css`

---

## 🐛 Troubleshooting

### Images not showing

1. Check file exists in `/images` folder
2. Verify filename matches module ID (lowercase, hyphens for `/`)
3. Check browser console for 404 errors
4. Try using custom mapping in `imageUtils.js`

### Hover effect not smooth

1. Verify CSS loaded: check `index.css` has shimmer keyframes
2. Check browser GPU acceleration enabled
3. Reduce other animations on the page

### Grid not responsive

1. Check browser screen size (use DevTools)
2. Verify media queries in `index.css` are correct
3. Clear browser cache (`Ctrl+Shift+R`)

---

## 📝 Notes

- **Backward Compatibility:** Original "No Image Available" fallback remains if images not provided
- **No Breaking Changes:** Existing module data & logic untouched
- **Performance:** Lazy loading minimizes initial load impact
- **Accessibility:** Images have proper `alt` text; icons used only for decoration

---

For questions or issues, refer to:

- [ModuleCard.jsx](src/components/ModuleCard.jsx) - Component source
- [imageUtils.js](src/utils/imageUtils.js) - Image utilities
- [index.css](src/index.css) - Styles
