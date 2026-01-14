# Refyn

> **"Evolve Every Prompt"** — Your AI-native prompt optimization companion that learns your creative taste.

---

## What is Refyn?

Refyn is a Chrome extension that acts as a universal prompt optimization layer across all major AI image generation platforms. It intercepts, enhances, and learns from your prompts to help you achieve better AI-generated outputs with less iteration.

**Supported Platforms:**
- Midjourney (Discord)
- DALL-E (ChatGPT)
- Leonardo AI
- Runway ML
- Ideogram
- Flux
- Higgsfield
- Kling
- Pika
- Luma
- ...and extensible to any platform

---

## The Problem It Solves

AI image generation requires crafting precise prompts — a skill that takes months to develop. Users waste hours:
- Iterating on poorly-structured prompts
- Re-discovering what works for each platform
- Losing track of successful prompt patterns
- Getting inconsistent results across platforms

**Refyn eliminates this friction** by bringing prompt intelligence directly into your workflow.

---

## Kernel: Strategic Diagnosis (1-5-10-20-40 Year Scope)

### Year 1: Foundation
*"Make prompt optimization frictionless"*
- Chrome extension with floating panel on all AI platforms
- Real-time prompt enhancement via Claude API
- Basic taste learning from likes/dislikes/trash actions
- Platform-specific syntax handling (--ar, --v, --weird for Midjourney)

### Year 5: Intelligence Layer
*"Your prompts know you better than you do"*
- Deep preference model predicts optimal prompts before you type
- Cross-platform style transfer (your Midjourney style → DALL-E syntax)
- Community prompt patterns (anonymized learning from millions)
- API for third-party integrations

### Year 10: Creative Co-pilot
*"From prompt tool to creative partner"*
- Multimodal input (sketch → prompt → image → refinement loop)
- Real-time generation preview before submission
- Automatic A/B testing of prompt variations
- Integration with design tools (Figma, Adobe)

### Year 20: Ambient Creativity
*"Prompts disappear; intent remains"*
- Brain-computer interface experiments for direct intent capture
- Generative workflows across video, 3D, music
- Personal creative AI that maintains your artistic identity
- Enterprise creative systems management

### Year 40: Creative Symbiosis
*"Human-AI creative fusion"*
- Seamless human-AI co-creation as standard practice
- Personal AI creative agents with decades of learned taste
- New art forms only possible through human-AI collaboration
- Refyn as the canonical interface between human creativity and AI capability

---

## Guiding Policy

**Policy 1: Invisible Intelligence**
> The best tool is one you forget you're using.

Refyn must enhance without interrupting. Every interaction should feel like a natural extension of the user's creative flow, not a separate step. The floating panel appears when needed, learns silently, and optimizes seamlessly.

**Policy 2: Taste is Personal**
> Never impose; always learn.

Every user has unique aesthetic preferences. Refyn never prescribes a "correct" style — it learns individual taste through observation (saves, likes, trashes) and adapts its suggestions accordingly. Your Refyn becomes uniquely yours.

---

## Strategic Objectives

### Objective 1: Universal Platform Coverage
Make Refyn work flawlessly on every major AI generation platform. Users should never have to leave Refyn regardless of which tool they're using.

**Key Results:**
- [ ] 10+ platforms supported with full functionality
- [ ] Platform auto-detection with 99% accuracy
- [ ] Consistent UX across all platforms

### Objective 2: Deep Taste Learning
Build a preference system that meaningfully improves prompt suggestions based on user behavior.

**Key Results:**
- [ ] Track likes, saves, and trash actions with feedback reasons
- [ ] Keyword scoring system that weights user preferences
- [ ] Measurable improvement in prompt acceptance rate over time

---

## Architecture Overview

```
refyn/
├── src/
│   ├── popup/           # Extension popup UI (React)
│   ├── dashboard/       # Full dashboard page
│   ├── content/         # Content scripts injected into pages
│   │   ├── content.ts           # Main entry, event handling
│   │   ├── FloatingPanel.ts     # Floating UI panel
│   │   ├── OutputObserver.ts    # Tracks AI outputs for learning
│   │   ├── platformDetector.ts  # Platform detection & input handling
│   │   └── content.css          # All injected styles
│   ├── background/      # Service worker for API calls
│   ├── lib/             # Shared utilities
│   │   ├── deepLearning.ts      # Taste learning system
│   │   ├── preferences.ts       # User preferences storage
│   │   ├── promptEngine.ts      # Prompt optimization logic
│   │   └── trashFeedbackTest.ts # Stress tests
│   └── shared/          # Types and constants
├── public/              # Static assets, manifest
└── dist/                # Built extension
```

---

## Key Features

### Floating Panel (Ctrl+Shift+E)
- Compact, draggable panel on any webpage
- Grab prompt from page / Insert optimized prompt
- Mode selector: Enhance, Expand, Simplify, Platform-optimize
- Preset styles: Cinematic, Photorealistic, Anime, etc.
- Moodboard toggle for Midjourney (strips --weird parameter)

### Taste Learning System
- **Positive signals:** Saved prompts, liked outputs
- **Negative signals:** Trashed outputs with reason feedback
- Keyword scoring (-10 to +10) based on user behavior
- Platform-specific preference tracking

### Trash Feedback Popup
When user clicks delete/trash on any platform:
- Quick preset reasons: Poor quality, Wrong style, Doesn't match, Too similar, Bad composition
- Custom text input for specific feedback
- Skip option for quick dismissal
- All feedback weighted into preference learning

---

## Development

```bash
# Install dependencies
npm install

# Development build with watch
npm run dev

# Production build
npm run build

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

---

## Next Steps for Claude (Continuation Context)

When resuming this project, Claude should know:

### Current State (January 2026)
1. **Core extension working** — Popup, floating panel, background service worker all functional
2. **Platform detection** — Works for Midjourney, DALL-E, Leonardo, Runway, and others
3. **Prompt optimization** — Claude API integration for enhance/expand/simplify modes
4. **Taste learning** — Deep preference system tracks keywords from likes/saves/trashes
5. **Trash feedback** — Popup appears on delete clicks with preset reasons + custom input
6. **Moodboard toggle** — Strips --weird parameter for Midjourney moodboard users

### Recent Work Completed
- Fixed prompt detection to exclude Refyn's own elements (`isRefynElement()`)
- Fixed React input insertion using native value setter
- Made floating panel appear on ALL pages (not just detected platforms)
- Added compact responsive CSS for smaller screens
- Implemented trash observer with platform-specific selectors
- Created trash feedback popup with 6 presets + custom input
- Added `recordTrashFeedback()` to deep learning system
- Created stress test file (`trashFeedbackTest.ts`)

### Known Issues / TODO
- [ ] Test trash feedback on live Midjourney (selectors may need tuning)
- [ ] Higgsfield-specific selectors for trash buttons
- [ ] Dashboard page needs full implementation
- [ ] Prompt library/history feature
- [ ] Export/import preferences
- [ ] Analytics dashboard for taste insights

### Key Files to Read First
1. `src/content/FloatingPanel.ts` — Main UI logic, trash observer
2. `src/content/platformDetector.ts` — Platform detection, input handling
3. `src/lib/deepLearning.ts` — Taste learning, preference scoring
4. `src/content/content.css` — All styles including compact panel, trash popup
5. `src/background/service-worker.ts` — API calls to Claude

### Testing Commands (Browser Console)
```javascript
// Run trash feedback stress test
window.refynTrashTest()

// Validate storage structure
window.refynTrashValidate()
```

### Build & Verify
```bash
npm run build  # Should complete with no errors
```

---

## License

Proprietary — All rights reserved.

---

*Built with Claude Code*
