# ✅ Module Selection UI - Implementation Checklist

## 🎯 Quick Start (5 Minutes)

- [ ] Read this checklist
- [ ] Open http://localhost:5173/ in browser
- [ ] Navigate to "Choose Modules" step
- [ ] Hover over any module card
- [ ] Confirm zoom effect works
- [ ] ✅ You're done with quick verification!

---

## 🧪 Visual Testing (10 Minutes)

### Desktop Experience

- [ ] Open browser DevTools (F12)
- [ ] Hover over module card
  - [ ] Image zooms smoothly (1.1x)
  - [ ] Card lifts up (-4px)
  - [ ] Shadow increases
  - [ ] Animation is smooth (no jank)
- [ ] Click +/− buttons
  - [ ] Quantity updates
  - [ ] Price updates
  - [ ] Button states change
- [ ] Check 4 columns visible
  - [ ] Cards fit nicely
  - [ ] Spacing looks good
  - [ ] No horizontal scroll

### Mobile Experience (768px and below)

- [ ] Open DevTools
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Switch to "iPad" view
  - [ ] Check 2 columns visible
  - [ ] Cards are responsive
  - [ ] Hover effects still work
- [ ] Switch to "Mobile" view
  - [ ] Check 1 column visible
  - [ ] Full width usage
  - [ ] No horizontal scroll
  - [ ] Buttons are easy to tap

### Tablet Experience (480px-768px)

- [ ] Simulate tablet size
- [ ] Verify 2 columns
- [ ] Check spacing & layout

---

## 🖼️ Image Testing (Optional but Recommended)

### Test with Missing Images (Current State)

- [ ] Module cards show "No Image Available"
- [ ] No console errors
- [ ] Cards still functional
- [ ] Layout intact

### Add Sample Images (How To)

1. [ ] Create folder: `/images/` if doesn't exist
2. [ ] Get module images (screenshots from PDF or real images)
3. [ ] Rename files to match convention:
   - [ ] `ow-sw-01.png` for module "OW/SW 01"
   - [ ] `ow-sw-02.png` for module "OW/SW 02"
   - [ ] `ow-dw-01.png` for module "OW/DW 01"
   - [ ] ...and so on
4. [ ] Save to `/images/` folder
5. [ ] Refresh browser
6. [ ] Images should appear!

### Test Image Loading

- [ ] Open DevTools > Network tab
- [ ] Refresh page
- [ ] Check images load with status 200
- [ ] Verify `loading="lazy"` working
  - [ ] Scroll to bottom
  - [ ] Only visible images loaded
- [ ] Delete one image file
- [ ] Refresh → "No Image Available" shows
- [ ] Restore image → Auto-reloads

---

## 📱 Responsive Testing

### Breakpoint 1: 1200px+ (Desktop)

- [ ] `npm run dev` running
- [ ] DevTools closed (full width)
- [ ] 4 columns visible
- [ ] Hover effects smooth
- [ ] No horizontal scroll

### Breakpoint 2: 768px-1200px (Tablet)

- [ ] DevTools > Device toolbar
- [ ] Select "iPad" or similar
- [ ] 2-3 columns visible
- [ ] Cards resized properly
- [ ] Hover effects work

### Breakpoint 3: 480px-768px (Small Tablet)

- [ ] DevTools > Device toolbar
- [ ] Manual size: 640x800
- [ ] 2 columns visible
- [ ] Cards sized correctly

### Breakpoint 4: <480px (Mobile)

- [ ] DevTools > Device toolbar
- [ ] Select "iPhone SE" or similar
- [ ] 1 column visible
- [ ] Full width usage
- [ ] Bottom buttons easy to click
- [ ] No horizontal scroll

---

## 🔧 Performance Testing

### Load Performance

- [ ] DevTools > Lighthouse
- [ ] Run test
- [ ] Check performance score
- [ ] Expected: No degradation from baseline

### Animation Performance

- [ ] DevTools > Rendering
- [ ] Enable "Paint flashing"
- [ ] Hover over module card
- [ ] Only image should paint (not whole card)
- [ ] Frame rate shows 60 FPS

### Network Performance

- [ ] DevTools > Network tab
- [ ] Clear cache
- [ ] Reload page
- [ ] Check images
  - [ ] No 404 errors
  - [ ] Proper file sizes (not bloated)
  - [ ] All load successfully

---

## 🐛 Error Handling Testing

### Image Not Found

- [ ] Delete a module image file
- [ ] Refresh browser
- [ ] Verify "No Image Available" message appears
- [ ] Verify no console errors
- [ ] Verify card still functional

### Network Error Simulation

- [ ] DevTools > Network tab
- [ ] Set throttling to "Offline"
- [ ] Try to load image
- [ ] Fallback shows (no crash)
- [ ] Set back to "Online"

### Custom Image Map

- [ ] Open `src/utils/imageUtils.js`
- [ ] Add custom mapping:
  ```javascript
  const CUSTOM_IMAGE_MAP = {
    'OW/SW 01': 'custom-hanging-1.png',
  };
  ```
- [ ] Create custom image file
- [ ] Verify uses custom name
- [ ] Remove mapping to revert

---

## 🎨 Customization Testing

### Test Zoom Level Change

- [ ] Edit `src/components/ModuleCard.jsx` line 113
- [ ] Change `scale(1.1)` to `scale(1.15)`
- [ ] Save file (hot reload)
- [ ] Hover over card
- [ ] Verify more zoom

### Test Height Change

- [ ] Edit `src/components/ModuleCard.jsx` line 50
- [ ] Change height from `160px` to `180px`
- [ ] Save file
- [ ] Verify taller image container

### Test Grid Spacing

- [ ] Edit `src/components/StepModules.jsx` line 170
- [ ] Change gap from `18px` to `24px`
- [ ] Save file
- [ ] Verify more space between cards

---

## 📊 Verification Checklist

### Code Quality

- [ ] No console errors
- [ ] No console warnings
- [ ] ESLint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`

### Functionality

- [ ] Module cards display
- [ ] Images load (or show fallback)
- [ ] Add button works
- [ ] Remove button works
- [ ] Quantity updates in real-time
- [ ] Price updates correctly
- [ ] Type badges show
- [ ] Module IDs visible

### Visual Design

- [ ] Hover zoom effect smooth
- [ ] Card elevation visible
- [ ] Shadow enhancement visible
- [ ] Shimmer animation works
- [ ] Color scheme matches design
- [ ] Typography readable
- [ ] Spacing consistent

### Responsiveness

- [ ] Desktop: 4 columns
- [ ] Tablet: 2-3 columns
- [ ] Mobile: 1 column
- [ ] No horizontal scroll at any size
- [ ] Touch targets large enough
- [ ] Layout adapts smoothly

### Performance

- [ ] No layout shift (CLS = 0)
- [ ] Smooth 60 FPS animations
- [ ] Lazy loading working
- [ ] Images optimized
- [ ] No unnecessary renders
- [ ] Memory stable

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All visual tests passed
- [ ] All responsive tests passed
- [ ] All performance tests passed
- [ ] No console errors/warnings
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Tested on real devices if possible

### Build

- [ ] `npm run build` completed
- [ ] `/dist/` folder created
- [ ] Check file sizes reasonable
- [ ] Source maps generated (for debug)

### Deployment

- [ ] Backup current version
- [ ] Deploy `/dist/` folder
- [ ] Test on staging server
- [ ] Verify all features work
- [ ] Get stakeholder approval
- [ ] Deploy to production

### Post-Deployment

- [ ] Monitor for errors
- [ ] Gather user feedback
- [ ] Track performance metrics
- [ ] Plan iteration/improvements

---

## 📝 Documentation Review

- [ ] Read [FINAL_SUMMARY.md](FINAL_SUMMARY.md)
- [ ] Read [MODULE_ENHANCEMENT_SUMMARY.md](MODULE_ENHANCEMENT_SUMMARY.md)
- [ ] Read [MODULE_IMAGES_GUIDE.md](MODULE_IMAGES_GUIDE.md)
- [ ] Read [CODE_COMPARISON.md](CODE_COMPARISON.md)
- [ ] Understand component architecture
- [ ] Know how to customize

---

## 🎓 Learning Path (Optional)

### Beginner

- [ ] Understand ModuleCard receives props
- [ ] Know how to add images to `/images/` folder
- [ ] Learn image naming convention

### Intermediate

- [ ] Modify zoom level in ModuleCard.jsx
- [ ] Change image container height
- [ ] Adjust grid spacing in StepModules.jsx

### Advanced

- [ ] Add custom image mappings
- [ ] Create new animations in CSS
- [ ] Extend ModuleCard with new features
- [ ] Optimize image sizes

---

## 📞 Troubleshooting

### Images Not Showing

- [ ] Check files exist in `/images/`
- [ ] Check naming convention (lowercase, hyphens)
- [ ] Open DevTools > Network, look for 404s
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Refresh page

### Hover Effect Not Smooth

- [ ] Check GPU acceleration enabled
  - [ ] DevTools > Settings > Rendering
  - [ ] Enable "Render layer borders"
- [ ] Check no other heavy animations
- [ ] Clear browser cache
- [ ] Restart dev server

### Grid Not Responsive

- [ ] Check screen size in DevTools
- [ ] Verify media queries in `index.css`
- [ ] Clear browser cache
- [ ] Restart dev server
- [ ] Check zoom level is 100%

### Button Not Working

- [ ] Open console, look for errors
- [ ] Check `onQtyChange` prop passed
- [ ] Verify `canAdd` logic working
- [ ] Check state updating correctly

---

## ✅ Final Verification

**Before marking as complete, verify:**

- [ ] Dev server runs without errors
- [ ] All visual effects work
- [ ] Responsive on all sizes
- [ ] Images load or fallback gracefully
- [ ] No console errors
- [ ] Performance is good
- [ ] Documentation is clear
- [ ] Ready to show stakeholders

---

## 🎊 You're Done!

Once all checkboxes are complete:

1. ✅ Close this checklist
2. ✅ Take a screenshot of the module selection UI
3. ✅ Share with team/stakeholders
4. ✅ Get feedback
5. ✅ Plan next enhancements
6. ✅ Deploy when ready!

---

**Estimated Time:**

- Quick Start: 5 min
- Visual Testing: 10 min
- Image Testing: 15 min (if doing)
- Responsive Testing: 15 min
- Performance Testing: 10 min
- **Total: ~45-55 minutes**

---

**Questions?** Refer to:

- [FINAL_SUMMARY.md](FINAL_SUMMARY.md) - Overview
- [MODULE_IMAGES_GUIDE.md](MODULE_IMAGES_GUIDE.md) - Image setup
- [CODE_COMPARISON.md](CODE_COMPARISON.md) - Technical details
- Source code comments
