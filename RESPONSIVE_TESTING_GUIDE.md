# NirmanBook Responsive Design - Quick Testing Guide

## 🚀 Quick Start Testing

### 1. Open Developer Tools

- **Chrome/Edge**: Press `F12`
- **Firefox**: Press `F12`
- **Safari**: Press `Cmd + Option + I`

### 2. Enable Device Emulation

- **Chrome**: Click device icon or `Ctrl + Shift + M`
- **Firefox**: Click responsive design icon or `Ctrl + Shift + M`

---

## 📱 Test Scenarios

### Test 1: Mobile (iPhone 12/13 - 390px width)

1. Set viewport to 390px width
2. **Check**:
   - ✅ Hamburger menu visible (top-left)
   - ✅ Logo smaller but readable
   - ✅ "Step X of 3" indicator visible
   - ✅ Module cards: **1 per row**, full-width
   - ✅ Bottom bar visible with price
   - ✅ No horizontal scrolling
   - ✅ All buttons ≥44px height

**Expected Layout**:

```
[Logo] [☰ Menu]
Step 1 of 3 - Dimensions & Modules
────────────────────────────
[Room Setup]
  Width: [slider]
  Type: [selector]
────────────────────────────
[Choose Modules]
  Search...
────────────────────────────
[Module 1 Card - Full Width]
[Module 2 Card - Full Width]
[Module 3 Card - Full Width]
────────────────────────────
[₹12,500] [⚙️]
[← Back] [Next →]
```

### Test 2: Small Mobile (iPhone SE - 360px width)

1. Set viewport to 360px width
2. **Check**:
   - ✅ Still readable, no text overflow
   - ✅ Buttons still easily tappable
   - ✅ Forms stack vertically
   - ✅ No content hidden or cut off
   - ✅ Bottom bar still accessible

### Test 3: Medium Phone (410px width)

1. Set viewport to 410px width
2. **Check**:
   - ✅ Extra spacing improves readability
   - ✅ Bottom bar has room for all elements

### Test 4: Tablet (iPad - 768px width)

1. Set viewport to 768px width
2. **Check**:
   - ✅ Sidebar appears and is visible
   - ✅ Module grid: **2 columns**
   - ✅ Header with navigation visible
   - ✅ Floating bottom bar appears
   - ✅ Step indicator horizontal

**Expected Layout**:

```
[Sidebar] | [Header with Steps]
[Logo]    | Step Indicator
[Nav]     | ───────────────────
[Price]   | [Content Area - 2-col grid]
[Links]   | [Module 1] [Module 2]
          | [Module 3] [Module 4]
          | [Floating Bar] ↗
```

### Test 5: Desktop (1920px width)

1. Set viewport to 1920px width
2. **Check**:
   - ✅ Full desktop layout restored
   - ✅ Sidebar fully visible (256px)
   - ✅ Module grid: **3-4 columns**
   - ✅ All original features work
   - ✅ Back-to-top button visible after scroll

---

## 🔄 Interactive Testing

### Test Mobile Menu

1. **On mobile (< 768px)**:
   - Click hamburger menu icon (☰)
   - ✅ Menu slides in from right
   - ✅ Backdrop darkens
   - ✅ Click "Saved Designs" → opens drawer
   - ✅ Click "Back to Home" → navigates away
   - ✅ Click outside menu → closes
   - ✅ Click ✕ button → closes

### Test Configuration Drawer

1. **On mobile (< 768px)**:
   - Click ⚙️ button in bottom bar
   - ✅ Drawer slides in from right
   - ✅ Shows:
     - Step indicators (1, 2, 3)
     - Price summary
     - Width usage bar
     - Catalogue link
     - User info
   - ✅ Click step number → navigates to that step
   - ✅ Click ✕ → closes drawer

### Test Navigation

1. **On any device**:
   - Click "Step 1" label → stays on step 1
   - Add modules to trigger "Step 2" unlock
   - Click "Next" → moves to step 2
   - Click "← Back" → moves to step 1
   - On step 3, click "Export Quote" → button text shows

### Test Forms

1. **On mobile**:
   - Click input fields → full-width, clear focus
   - Inputs should NOT zoom viewport
   - Sliders work with touch
   - Buttons easy to tap (44px+)

### Test Bottom Bar Behavior

1. **On mobile**:
   - Scroll down → bottom bar stays fixed
   - Price updates in real-time as modules added
   - Buttons always visible and accessible

---

## 🎨 Visual Checks

### Colors & Contrast

- ✅ Text readable on all backgrounds
- ✅ Buttons clearly distinguishable
- ✅ Form inputs visible and clear
- ✅ Icons properly sized

### Spacing & Alignment

- ✅ No content crowded
- ✅ 12px gaps between sections (mobile)
- ✅ 16px+ gaps between elements
- ✅ Padding consistent

### Typography

- ✅ Headings: Bold, clear hierarchy
- ✅ Body text: Readable (12-14px on mobile)
- ✅ Labels: Distinct from content
- ✅ Numbers/prices: Prominent

---

## 🔧 Advanced Testing

### Test Orientation Changes (Mobile)

1. Start in portrait mode
2. Rotate to landscape
3. ✅ Content reflows properly
4. ✅ Bottom bar adjusts height
5. ✅ No cut-off content
6. Rotate back to portrait
7. ✅ Layout restores correctly

### Test Keyboard Navigation (Desktop)

1. Press `Tab` key repeatedly
2. ✅ Focus moves through interactive elements
3. ✅ Focus visible (blue outline)
4. ✅ Can operate buttons with `Enter`
5. ✅ Can operate form fields

### Test Touch Simulation (DevTools)

1. In Chrome DevTools, enable "Emulate touch events"
2. Try clicking buttons
3. ✅ All buttons respond to touch
4. ✅ No "hover" issues on touch

### Test Slow Network (DevTools)

1. In Chrome DevTools, set throttle to "Slow 4G"
2. ✅ Page loads without layout shift
3. ✅ Images load progressively
4. ✅ Responsive CSS loads before content

---

## 🐛 Common Issues & Fixes

### Issue: Bottom bar covers content

**Fix**: Check if main content has `paddingBottom: 140px` on mobile

### Issue: Grid still shows 3 columns on mobile

**Fix**: Ensure `.module-grid` has media query:

```css
@media (max-width: 767px) {
  .module-grid {
    grid-template-columns: 1fr !important;
  }
}
```

### Issue: Menu doesn't open

**Fix**: Check if `MobileNav` is imported and rendered above 768px breakpoint

### Issue: Bottom bar appears on desktop

**Fix**: Ensure `.mobile-bottom-bar` has `@media (max-width: 767px)`

### Issue: Buttons too small on mobile

**Fix**: Check minimum button height is `44px`:

```css
button {
  min-height: 44px;
}
```

### Issue: Text too small on iPhone

**Fix**: Ensure font-size is `≥16px` for input fields to prevent zoom

---

## ✅ Final Verification Checklist

Before declaring responsive design complete:

### Mobile (< 768px)

- [ ] Hamburger menu works
- [ ] Configuration drawer opens/closes
- [ ] Bottom bar always visible
- [ ] No horizontal scrolling
- [ ] All buttons ≥44px × 44px
- [ ] Forms full-width, readable
- [ ] Module grid 1 column
- [ ] Touch scrolling smooth
- [ ] Content not hidden behind bar

### Tablet (768px - 1024px)

- [ ] Sidebar visible
- [ ] Module grid 2 columns
- [ ] All breakpoints triggered correctly
- [ ] Header visible and functional

### Desktop (> 1024px)

- [ ] Original layout intact
- [ ] 3-4 column grid
- [ ] Floating bottom bar
- [ ] Back-to-top button works
- [ ] Sidebar full-featured

### All Sizes

- [ ] Theme switching works (light/dark)
- [ ] No console errors
- [ ] Navigation works everywhere
- [ ] Forms functional
- [ ] Saved designs accessible
- [ ] Smooth animations (not janky)

---

## 📊 Performance Checklist

Use Chrome DevTools > Performance tab:

- [ ] First Contentful Paint (FCP) < 2s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.5s

---

## 🎯 Browser Compatibility

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Safari on iOS 14+
- [ ] Chrome on Android 8+

---

## 📝 Bug Report Template

If you find issues, document with:

```
**Device**: [iPhone 12 / iPad / Desktop]
**Viewport**: [390px width / 768px width / 1920px width]
**Browser**: [Chrome / Safari / Firefox]
**Issue**: [Describe what's wrong]
**Expected**: [What should happen]
**Actual**: [What actually happens]
**Screenshot**: [If possible]
```

---

## 🎉 Success Criteria

The responsive design is successful when:

1. ✅ Looks natural on mobile (not like shrunk desktop)
2. ✅ One-handed operation possible on phones
3. ✅ All features accessible on mobile
4. ✅ No layout shifts on resize
5. ✅ Smooth interactions and animations
6. ✅ Touch targets adequately sized
7. ✅ Text readable at all sizes
8. ✅ No content hidden or overlapped
9. ✅ Works on real devices (not just DevTools)
10. ✅ Performance meets standards

---

**Generated**: April 17, 2026
**Version**: 1.0
**Status**: Ready for Testing
