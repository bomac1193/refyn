# The Strange Frontier: Experimental AI Prompting Techniques

*A comprehensive research compilation on unconventional, experimental, and boundary-pushing prompting techniques across AI generation platforms*

**Research compiled:** January 2026
**Platforms covered:** Midjourney, DALL-E, Stable Diffusion, Leonardo.AI, Flux, Runway, Pika Labs, Higgsfield, Suno, Udio

---

## Executive Summary

This document compiles research from Discord communities, Reddit discussions, academic papers, and platform documentation to catalog the strange, experimental, and unconventional techniques that push AI generation systems into uncharted aesthetic territory. The goal: to identify patterns, parameters, and prompting strategies that can invent new visual and audio styles.

---

## Part 1: The Parameter Alchemy

### Midjourney's Chaos Trinity

Midjourney offers three interconnected parameters that, when combined strategically, produce increasingly experimental results:

| Parameter | Range | Effect |
|-----------|-------|--------|
| `--weird` (or `--w`) | 0-3000 | Injects "originality" - pushes toward unexpected interpretations |
| `--chaos` (or `--c`) | 0-100 | Controls variation between the four generated images |
| `--stylize` (or `--s`) | 0-1000 | Amount of Midjourney's "house aesthetic" applied |

#### The Discovery: Stacking for Maximum Weird

Community research reveals that combining equal values of `--weird` and `--stylize` produces "weird but beautiful" results - experimental enough to break conventions but aesthetically coherent enough to remain compelling.

**The Sweet Spots:**
- **Mild experimentation:** `--weird 250 --chaos 25 --stylize 200`
- **Moderate chaos:** `--weird 500 --chaos 50 --stylize 500`
- **Unhinged territory:** `--weird 1500 --chaos 90 --stylize 750`
- **Maximum chaos:** `--weird 3000 --chaos 100 --stylize 1000`

**Key Insight:** Simple prompts + high weird values = maximum impact. Complex prompts dilute the weird effect.

*Sources: [Midjourney Weird Docs](https://docs.midjourney.com/hc/en-us/articles/32390120435085-Weird), [Midlibrary V6 Guide](https://midlibrary.io/midguide/midjourney-v6-in-depth-review-part-3-parameters)*

---

### The Multi-Prompt Collision Technique

Midjourney's `::` syntax allows forcing conceptual collisions that the AI wouldn't naturally create.

#### Basic Collision
```
space ship     → sci-fi spaceship
space:: ship   → a sailing ship in outer space
```

#### Weighted Reality Bending
```
{subject}::1.5 impossible physics::0.8 photorealistic::0.5
```

#### Negative Weight Creativity
Using negative weights doesn't just remove elements - it can create inverse pressure:
```
portrait::2 normal::-1 expected::-0.5
```
This pushes the AI away from "normal" and "expected" interpretations.

#### Style Wars
Force conflicting artistic styles to battle:
```
{subject}::1 baroque ornate::0.8 brutalist minimal::-0.3
```

*Source: [Midjourney Multi-Prompts Docs](https://docs.midjourney.com/hc/en-us/articles/32658968492557-Multi-Prompts-Weights)*

---

### Style Tuner: Inventing Personal Aesthetics

Midjourney's `/tune` command creates custom style codes that can be chained together.

**The Discovery:** Style codes can be combined to create hybrid aesthetics:
```
--style abc123 def456 ghi789
```

**Random Style Generation:**
```
--style random
```
Generates a random tuned style without opening the Style Tuner interface - useful for pure experimentation.

*Source: [VentureBeat Style Tuner Guide](https://venturebeat.com/ai/midjourneys-new-style-tuner-is-here-heres-how-to-use-it)*

---

## Part 2: The Keyword Triggers

### Glitch & Digital Corruption Keywords

These keywords reliably trigger digital artifact aesthetics:

**Low Intensity (Subtle Glitch):**
- `chromatic aberration`, `scan lines`, `VHS static`, `analog noise`
- `soft focus`, `lens distortion`, `light leak`

**Medium Intensity (Visible Corruption):**
- `glitch art`, `data corruption`, `pixel sorting`
- `datamosh`, `compression artifacts`, `signal decay`
- `fragmented`, `distorted`, `warped`

**High Intensity (Full Breakdown):**
- `deep fried`, `jpeg artifacts`, `nuked aesthetic`
- `reality collapse`, `dimensional rift`, `perception error`
- `memory corruption`, `ego death visualization`

*Sources: [Midlibrary Glitch Art Styles](https://midlibrary.io/styles/glitch-art), [Galaxy.ai Glitch Prompts](https://blog.galaxy.ai/midjourney-prompts-for-glitch-art)*

---

### Liminal & Uncanny Keywords

The "backrooms" aesthetic has spawned an entire vocabulary:

- `liminal space`, `transitional area`, `poolrooms`
- `empty mall at 3am`, `abandoned arcade`
- `uncanny valley`, `something wrong`, `off-putting`
- `faded carpet`, `fluorescent lighting`, `institutional`
- `no people`, `eternal waiting room`

**The Formula:**
```
[mundane location] + liminal space + [time descriptor] + uncanny atmosphere
```

*Source: [Stable Diffusion Liminal Prompts](https://stablediffusionweb.com/prompts/uncanny-cursed-image-photorealistic-selfie-of-3d-pale-anime-horror-woman-with-black-hair-and-piercing-eyes-in-interesting-institutional-liminal-space-backrooms)*

---

### Horror & Cosmic Dread Keywords

**Lovecraftian/Eldritch:**
- `cosmic horror`, `eldritch`, `incomprehensible entity`
- `impossible geometry`, `non-euclidean`, `existential dread`
- `tentacles`, `void`, `ancient`, `forbidden knowledge`

**Body Horror:**
- `mutation`, `biomechanical`, `Cronenberg`
- `flesh machinery`, `anatomical impossibility`
- `too many eyes`, `merged faces`, `melting`

**Artist References for Horror:**
- Junji Ito, Kentaro Miura, H.R. Giger, Francis Bacon
- Zdzislaw Beksinski, Wayne Barlowe

*Sources: [PromptHero Horror Prompts](https://prompthero.com/horror-prompts), [Artvy Eldritch Horror](https://www.artvy.ai/prompt/eldritch-horror-masterpiece)*

---

### The "Cursed Image" Formula

Research reveals the components of reliably "cursed" outputs:

1. **Mundane subject** + **Wrong context**
2. **Almost-correct** anatomy or physics
3. **Inexplicable elements** that shouldn't be there
4. **Poor image quality** as aesthetic (jpeg, low-res, flash photo)

**Example structure:**
```
[ordinary thing] in [wrong place], cursed photo, flash photography,
grainy, something is wrong, uncomfortable, ominous atmosphere
```

---

## Part 3: Platform-Specific Discoveries

### Stable Diffusion: Negative Embeddings

**EasyNegative** and **bad_prompt** embeddings act as trained negative prompts, reducing artifacts without manual keyword listing.

**Discovery:** Using negative embeddings creatively - applying them at low strength can intentionally introduce controlled imperfections:
```
Negative: EasyNegative:0.3
```

*Sources: [EasyNegative Guide](https://blogs.novita.ai/understanding-easynegative-a-comprehensive-guide/), [Stable Diffusion Negative Embeddings](https://www.yeschat.ai/blog-5-MUST-Have-Stable-Diffusion-Negative-Embeddings-19276)*

---

### Flux: Natural Language Chaos

Flux responds to natural language descriptions better than keyword stacking. The experimental approach:

**Dynamic Language:**
Instead of: `mountain with mist`
Use: `mist crawling up the mountain face, swallowing the peaks`

**Layered Prompts:**
Break scenes into spatial layers:
```
[background description] | [middle ground] | [foreground] | [overall mood]
```

**Style Fusion:**
Flux handles multiple conflicting styles better than most models:
```
combining baroque ornamentation with brutalist architecture,
photorealistic rendering of impossible merger
```

*Sources: [FLUX.1 Prompt Guide](https://www.giz.ai/flux-1-prompt-guide/), [AI/ML API Flux Guide](https://aimlapi.com/blog/master-the-art-of-ai-top-10-prompts-for-flux-1-by-black-forests-labs)*

---

### DALL-E 3: Working Within Constraints

DALL-E 3's ChatGPT interface rewrites prompts. Experimental approaches:

**Forcing Literalism:**
```
I want you to generate exactly this, do not modify: [prompt]
```

**Compositional Building:**
Generate elements separately, then describe their combination explicitly.

**Style Anchoring:**
Reference specific, obscure artists to escape "DALL-E look":
```
in the style of [obscure artist], not generic AI art
```

*Source: [DALL-E 3 Review 2025](https://skywork.ai/skypage/en/DALL-E-3-In-Depth-(2025):-My-Hands-On-Review,-Benchmarks,-and-Practical-Guide/1976472460575436800)*

---

### Leonardo.AI: Negative Prompt Precision

Leonardo allows granular negative prompting. Experimental use:

**Negative Prompt as Style Guide:**
Instead of avoiding errors, use negatives to define what you DON'T want stylistically:
```
Negative: clean lines, perfect symmetry, corporate aesthetic, stock photo
```

This pushes toward organic, imperfect, authentic aesthetics.

*Source: [Leonardo AI Prompting Tips](https://intercom.help/leonardo-ai/en/articles/8067671-prompting-tips-tricks)*

---

## Part 4: Video Generation Frontiers

### Runway Gen-3/Gen-4

**FPV Chaos:**
First-person view prompts create immersive, disorienting content:
```
Camera flies out of a mouth into a vast landscape, continuous shot
```

**VHS Degradation:**
```
VHS tape recording, tracking errors, magnetic interference, dated 1987
```

**Prompt Structure:**
```
[Camera movement] + [Subject action] + [Environmental change] + [Mood/lighting]
```

*Sources: [Runway Gen-3 Guide](https://help.runwayml.com/hc/en-us/articles/30586818553107-Gen-3-Alpha-Prompting-Guide), [Runway Gen-4 Guide](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide)*

---

### Pika Labs: The Pikapocalypse

Pika's experimental effect suite includes:

- **Inflate:** Characters expand like balloons
- **Melt:** Subjects liquefy and reform
- **Explode:** Dramatic fragmentation effects
- **Squish:** Compression and deformation

**Horror Techniques:**
```
-neg smooth, clean, normal
-camera zoom in slow
-motion 1  (low motion = unsettling)
darker desaturated colors, horror atmosphere
```

*Sources: [Pika AI Effects](https://pikartai.com/effects/), [Pika Labs Guide](https://medium.com/@mattmajewski/exploring-pika-labs-the-ultimate-guide-to-creating-amazing-video-clips-cd947e6eee1f)*

---

### Higgsfield: Impossible Camera Moves

**Higgsfield Mix** allows combining camera moves that can't exist in reality:

```
Snorricam + drone sweep + levitation
Arc shot + infinite zoom + reality warp
```

**The Formula:**
```
[Composition] + [Subject] + [Camera move] + [Mood]
Medium close-up, eye level. Subject turns slightly. Slow dolly-in. Soft cinematic lighting.
```

**Abstract Mode:**
Selecting "Abstract" style enables surreal, non-representational outputs.

*Sources: [Higgsfield Prompt Guide](https://higgsfield.ai/blog/Prompt-Guide-to-Cinematic-AI-Videos), [Higgsfield AI Guide](https://filmart.ai/higgsfield-ai-guide-higgsfield-ai-prompts/)*

---

## Part 5: Audio Generation Experiments

### Suno: The "Absolutely Bonkers" Technique

Adding "Absolutely Bonkers" to prompts triggers:
- Fast tempos and hard-hitting beats
- Unexpected genre mashups
- Sudden intensity shifts
- Polka-metal fusion, cybernetic bagpipes territory

**Genre Collision Examples:**
```
Chilling surreal ambient meets explosive industrial beats
Aggressive raw punk fused with sophisticated baroque classical
Folk banjo meets synthesizer, rural futurism
```

**Experimental Tags:**
- `Avant-Garde`, `Non-linear`, `Dissonant`, `Abstract`
- `Polyrhythmic layers`, `Constantly shifting tempos`
- `Microtonal`, `Xenharmonic`

*Sources: [Jack Righteous Bonkers Guide](https://jackrighteous.com/en-us/blogs/guides-using-suno-ai-music-creation/suno-ai-absolutely-bonkers-prompt), [Suno Prompt Guide](https://howtopromptsuno.com/)*

---

### Udio: Sectional Chaos

Udio's Extend feature allows building chaotic compositions:

1. Generate a calm intro
2. Extend with contrasting section using different prompt
3. The AI attempts to bridge incompatible styles

**Noise/Experimental Tags:**
```
Dark Ambient, Industrial Noise, dissonant strings,
sub-bass rumble, metallic scrapes, horror atmosphere
```

**Historical Triggers:**
- `Musique Concrète` - tape manipulation aesthetic
- `Stockhausen`, `Xenakis` - avant-garde electronic
- `Field recordings`, `Found sound`

*Sources: [Experimental Music Genre Guide](https://sunoprompt.com/music-style-genre/experimental-music-genre), [Ambient Music Guide](https://sunoprompt.com/music-style-genre/ambient-music-genre)*

---

## Part 6: Emerging Aesthetic Movements

### The "Poetics of Imperfection"

A counter-movement to hyper-polished AI art:
- Deliberately guiding AI to replicate flaws
- Embracing analog artifacts: film grain, brush textures
- Hybrid aesthetics mixing traditional techniques with digital

**Key Artists:**
- **Mario Klingemann**: "Machine intuition" and glitch aesthetics
- **Refik Anadol**: Data sculptures, ecological AI art
- **Wangechi Mutu**: Kenyan cosmic biology/surrealism

*Sources: [AI Art Trends 2025](https://www.deeparteffects.com/2025/05/12/ai-art-trends-2025-key-developments-for-artists-designers/), [PictoFlux AI Art Trends](https://pictoflux.com/posts/ai-art-trends-2025)*

---

### Hyperreal Surrealism

The dominant emerging movement: combining impossible surrealist logic with photorealistic precision.

**The Formula:**
```
[impossible scenario], hyperrealistic, 8K detail,
photographed with [specific camera/lens],
[lighting condition], every detail rendered with precision
```

The more photorealistic the rendering, the more powerful the surreal impact.

---

### Cyberpunk Neon & Retro-Futurism

Heavy 80s nostalgia combined with modern AI capabilities:

**Keywords:**
- `synthwave`, `outrun`, `neon noir`
- `Blade Runner atmosphere`, `cyberpunk 2077`
- `chrome reflections`, `rain-slicked streets`
- `holographic`, `LED underglow`

---

## Part 7: Advanced Techniques

### ComfyUI: Workflow Experimentation

**Multi-ControlNet Stacking:**
Layer multiple ControlNet models for precise chaos:
1. OpenPose for pose
2. Canny for edges
3. Depth for spatial
4. QRCode Monster for hidden patterns

**Hidden Content Workflows:**
Workflows exist to embed hidden faces or text within images - invisible at first glance but emerging under scrutiny.

*Sources: [ComfyUI Workflows](https://openart.ai/workflows/home), [ControlNet ComfyUI](https://stable-diffusion-art.com/controlnet-comfyui/)*

---

### Adversarial Prompt Techniques

**Note:** These are documented for research/defensive purposes.

**Hidden Instructions in Images:**
Multimodal AI can read text embedded in images. Researchers have demonstrated:
- Instructions hidden in image metadata
- Zero-width Unicode characters carrying prompts
- Steganographic prompt injection

**Adversarial Suffixes:**
Strings of seemingly random characters that function as hidden commands to models.

*Sources: [NIST AI Prompt Injection Report](https://www.ibm.com/think/insights/ai-prompt-injection-nist-report), [Adversarial Prompting Guide](https://www.promptingguide.ai/risks/adversarial)*

---

## Part 8: The Chaos Intensity Framework

Based on all research, here's a systematic framework for controlled chaos:

### Level 1: Subtle (10-25%)
- Light atmospheric effects
- Soft artistic touches
- Keywords: `ethereal`, `dreamlike`, `atmospheric`, `moody`
- Midjourney: `--weird 100-250`

### Level 2: Noticeable (25-45%)
- Visible experimental elements
- Artistic rule-bending
- Keywords: `surreal`, `distorted perspective`, `impossible`
- Midjourney: `--weird 250-500 --chaos 25-40`

### Level 3: Strong (45-65%)
- Clear departure from reality
- Mixed styles, temporal confusion
- Keywords: `glitch art`, `liminal`, `uncanny`
- Midjourney: `--weird 500-750 --chaos 40-60`

### Level 4: Wild (65-85%)
- Reality breakdown
- Horror/cosmic elements acceptable
- Keywords: `cosmic horror`, `fever dream`, `datamosh`
- Midjourney: `--weird 750-1500 --chaos 60-85`

### Level 5: Maximum (85-100%)
- Full experimental mode
- All conventions abandoned
- Keywords: `cursed`, `nightmare fuel`, `anti-aesthetic`
- Midjourney: `--weird 1500-3000 --chaos 85-100`

---

## Part 9: Underground & Experimental Techniques

*The truly strange territory - exploiting failure modes, model collapse aesthetics, and undocumented behaviors.*

### Model Collapse as Aesthetic

**"Habsburg AI" / "AI Inbreeding"**

When AI models train on their own outputs recursively, they undergo "model collapse" - a deterioration that produces increasingly homogeneous, strange results. Researchers call this "Habsburg AI" or "AI cannibalism."

**The Deterioration Pattern:**
1. **Early collapse**: Minority/edge-case data disappears first
2. **Mid collapse**: Different concepts blur together
3. **Late collapse**: Outputs converge to "visual elevator music" - generic, samey results

**Research Finding:** A December 2025 study in *Patterns* found that autonomous AI-to-AI creative loops across 700 trajectories ALL converged to nearly identical visuals regardless of starting prompts - revealing deep architectural constraints.

**Creative Application:** Deliberately feeding outputs back as inputs through multiple generations can create unique "degraded" aesthetics - like photocopying a photocopy until it becomes abstract.

*Sources: [Nature - Model Collapse](https://www.nature.com/articles/s41586-024-07566-y), [Patterns Journal Study](https://www.cell.com/patterns/fulltext/S2666-3899(25)00299-5), [IBM Model Collapse](https://www.ibm.com/think/topics/model-collapse)*

---

### Extreme CFG Scale Exploitation

**What happens at CFG 30+:**
- Facial structures become unrecognizable
- Rainbow-like color distortions appear
- Features fragment into "glitchy mosaic"
- Images look like "fractal DMT trips"
- Complete coherence breakdown

**The Terminal setting:** Some users report that running Stable Diffusion via Terminal (bypassing UI limits) allows CFG values up to 999 for maximum distortion.

**Dynamic Thresholding Workaround:** The "Dynamic Thresholding" extension allows high CFG (50+) while preventing total "burn" - enabling controlled extremity.

*Sources: [Stable Diffusion CFG Guide](https://stable-diffusion-art.com/samplers/), [Dynamic Thresholding Extension](https://github.com/mcmonkeyprojects/sd-dynamic-thresholding)*

---

### Ancestral Sampler Chaos

Samplers marked with "a" (Euler a, DPM2 a) add random noise at each step - they NEVER converge.

**Why this matters:**
- Same seed + same parameters = different results each time
- More steps ≠ better quality, just different variations
- The randomness is architectural, not a bug

**Creative use:** Use ancestral samplers when you WANT unpredictability. Run the same prompt 100 times and curate the chaos.

**DPM++ SDE** has similar non-convergent behavior - images "fluctuate significantly" as step counts change.

*Source: [Complete Sampler Guide](https://stable-diffusion-art.com/samplers/)*

---

### Cursed LoRAs & Intentional Failures

**From Civitai's underground:**

1. **"Cursed Images (Nightmare Fuel)"** - Originally a failed model training that produced nightmare-worthy outputs. Creator notes: "Model for shexyo that ended in failure but might be good for nightmare fuel."

2. **"EvilLoRA"** - Designed to "infuse darkness and horror into otherwise ordinary scenes." Can turn cake or lasagna into nightmare fuel.

3. **"Cool Creepy Dark Art"** - A LoRA extracted from a fine-tune that "died mid-training" - trained without captions on films MANDY and BEYOND THE BLACK RAINBOW.

4. **"Cursed (Flux LoRA)"** - Created specifically to bypass Flux's strict filters for horror content. Keywords: "many cuts and wounds with blood," "undead figure," "sharp teeth."

**The Pattern:** Many interesting "cursed" models come from FAILED training runs that produced unexpected but aesthetically interesting results.

*Sources: [Civitai Cursed Images LoRA](https://civitai.com/models/920933/cursed-images-nightmare-fuel-style), [EvilLoRA](https://civitai.com/models/95377/evillora), [Flux Cursed LoRA](https://civitai.com/models/655938/cursed-flux-lora)*

---

### CLIP Interrogator Glitches

CLIP Interrogator reverse-engineers prompts from images, but produces strange outputs:

**Documented glitch:** One analysis produced: "a woman with purple hair and a necklace on her neck and a necklace on her neck, with a necklace on her neck, by Ilya Kuvshinov wearing a necklace around her neck, wearing a necklace around her neck"

**Why it happens:** CLIP matches against pre-defined keyword lists that may not align with image content, creating surreal, repetitive descriptions.

**Creative use:** Feed CLIP Interrogator outputs directly into generation for recursive weirdness - the model's "misunderstanding" becomes the prompt.

*Source: [CLIP Interrogator Guide](https://skywork.ai/skypage/en/clip-interrogator-reverse-prompting/1977579135663403008)*

---

### Negative Embedding Manipulation

**Standard use:** Negative embeddings (EasyNegative, bad_prompt) improve quality by avoiding trained "bad" patterns.

**Underground technique:** Use negative embeddings at LOW strength (0.2-0.4) to INTENTIONALLY introduce controlled imperfections:
```
Negative: EasyNegative:0.3
```

This partially reintroduces the "errors" the embedding was trained to avoid.

**bad_prompt v2 quirk:** Can unintentionally shift art style toward anime. Some artists exploit this for style transfer.

*Sources: [Textual Inversion Guide](https://aituts.com/textual-inversion/), [bad_prompt Embedding](https://civitai.com/models/55700/badprompt-negative-embedding)*

---

### AI Hallucination Harvesting

AI hallucinations in images - extra fingers, impossible anatomy, merged faces - are usually considered failures. Underground artists harvest them deliberately.

**Reliable hallucination triggers:**
- Hands interacting with complex objects
- Multiple people in close proximity
- Reflective surfaces with faces
- Text rendering attempts
- Animals with human features

**DeepDream aesthetic:** The "puppy-slug" effect from DeepDream - familiar features in impossible arrangements - creates "vertiginous sensation when the mind tries to reconcile familiar features in unnatural, physically impossible arrangements."

*Sources: [AI Hallucination Examples](https://journal.everypixel.com/ai-hallucination-examples), [DeepDream Art Analysis](https://studioamelia.medium.com/the-art-of-deepdream-and-dall-e-4455d13132ca)*

---

### Secret SREF Codes

Midjourney's `--sref` (style reference) codes are numerical values that lock specific aesthetics.

**The discovery:** Once you find a style you like, the code is FIXED. Community members trade codes like currency.

**Underground markets:** Artists share successful SREF codes on:
- Private Discord servers
- Reddit's r/midjourney
- Twitter/X with #sref hashtag
- Civitai comments sections

**Random exploration:**
```
--sref random
```
Generates random style codes for pure experimentation.

**Code chaining:** Combine multiple SREF codes for hybrid aesthetics:
```
--sref 579955689 382847261 194738292
```

*Sources: [SREF Codes Guide](https://medium.com/@ashley-insights/the-secret-number-how-to-find-the-midjourney-sref-code-and-clone-any-aesthetic-d4fb043357c8), [Hidden Worlds SREF](https://medium.com/complete-midjourney/midjourney-sref-codes-unlock-the-top-10-hidden-worlds-discovered-by-the-ai-community-f1b474ced7cf)*

---

### The "Final Step Glitch"

A documented bug where "generated images are screwed up in the last step(s)" - generation looks great during processing "until the last steps. Then it is as if there was a sort of sharpening taking place in certain places."

**With LMS sampler:** "The problem areas are just made into glitchy mosaic in the last steps."

**Creative exploitation:** Stop generation 1-2 steps before completion to capture the "pre-glitch" state, or deliberately let the glitch occur for aesthetic effect.

*Source: [Final Step Bug Discussion](https://github.com/AUTOMATIC1111/stable-diffusion-webui/issues/7244)*

---

### ControlNet Skeleton Manipulation

Using "wrong" or impossible OpenPose skeletons:

**Extra limbs technique:** Set ControlNet weight to 2.0+ to force the model to render impossible anatomy instead of replacing limbs with background.

**The resistance:** Models naturally try to "correct" impossible skeletons. Higher weights = more force to render the impossible.

**Multi-ControlNet stacking:** Combine OpenPose with Canny + Depth maps to force surreal anatomy while maintaining coherent style.

*Source: [OpenPose ControlNet Discussions](https://github.com/Mikubill/sd-webui-controlnet/discussions/)*

---

### Low Denoising Noise Injection

**img2img at extreme low denoising (0.1-0.3):**
- Output stays very close to input
- Small, dream-like modifications accumulate
- Multiple passes create gradual "drift"

**Recursive application:** Feed output back as input repeatedly at low denoising for slow-motion transformation into abstraction.

**Hidden settings:** `initial_noise_multiplier` and `img2img_extra_noise` in quicksettings allow fine-tuning noise injection for experimental results.

*Source: [img2img Denoising Guide](https://onceuponanalgorithm.org/guide-what-denoising-strength-does-and-how-to-use-it-in-stable-diffusion/)*

---

## Conclusion: Inventing New Styles

The research reveals several patterns for pushing AI into genuinely novel aesthetic territory:

1. **Parameter Extremes**: Push values beyond "recommended" ranges
2. **Conceptual Collisions**: Force incompatible ideas together
3. **Style Conflicts**: Make the AI reconcile irreconcilable aesthetics
4. **Negative Space**: Define what you DON'T want to shape what emerges
5. **Platform Quirks**: Each platform has unique failure modes that become features
6. **Iteration**: The strange emerges from rapid experimentation, not single prompts

The frontier of AI art isn't in perfecting photorealism - it's in the controlled chaos between what these systems were trained to do and what we force them to attempt.

---

## Sources

### Official Documentation
- [Midjourney Weird Parameter](https://docs.midjourney.com/hc/en-us/articles/32390120435085-Weird)
- [Midjourney Chaos/Variety](https://docs.midjourney.com/docs/chaos)
- [Midjourney Multi-Prompts](https://docs.midjourney.com/hc/en-us/articles/32658968492557-Multi-Prompts-Weights)
- [Midjourney Permutations](https://docs.midjourney.com/hc/en-us/articles/32761322355597-Permutations)
- [Runway Gen-3 Guide](https://help.runwayml.com/hc/en-us/articles/30586818553107-Gen-3-Alpha-Prompting-Guide)
- [Runway Gen-4 Guide](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide)
- [Leonardo AI Prompting Tips](https://intercom.help/leonardo-ai/en/articles/8067671-prompting-tips-tricks)

### Community Guides
- [Midlibrary V6 Parameters Guide](https://midlibrary.io/midguide/midjourney-v6-in-depth-review-part-3-parameters)
- [Midlibrary Glitch Art Styles](https://midlibrary.io/styles/glitch-art)
- [Midlibrary Style Tuner Explained](https://midlibrary.io/midguide/midjourney-style-tuner-explained)
- [FLUX.1 Prompt Guide](https://www.giz.ai/flux-1-prompt-guide/)
- [Suno Prompt Guide](https://howtopromptsuno.com/)
- [Experimental Music Genre Guide](https://sunoprompt.com/music-style-genre/experimental-music-genre)

### Platform-Specific
- [Higgsfield Prompt Guide](https://higgsfield.ai/blog/Prompt-Guide-to-Cinematic-AI-Videos)
- [Pika AI Effects](https://pikartai.com/effects/)
- [ComfyUI Workflows](https://openart.ai/workflows/home)
- [Stable Diffusion Negative Prompts](https://getimg.ai/guides/guide-to-negative-prompts-in-stable-diffusion)

### Research & Analysis
- [VentureBeat Style Tuner](https://venturebeat.com/ai/midjourneys-new-style-tuner-is-here-heres-how-to-use-it)
- [AI Art Trends 2025](https://www.deeparteffects.com/2025/05/12/ai-art-trends-2025-key-developments-for-artists-designers/)
- [NIST AI Prompt Injection](https://www.ibm.com/think/insights/ai-prompt-injection-nist-report)
- [Adversarial Prompting Guide](https://www.promptingguide.ai/risks/adversarial)

### Prompt Databases
- [PromptHero Horror Prompts](https://prompthero.com/horror-prompts)
- [Galaxy.ai Glitch Art Prompts](https://blog.galaxy.ai/midjourney-prompts-for-glitch-art)
- [Stable Diffusion Cursed Prompts](https://stablediffusionweb.com/prompts/cursed-images)

### Underground & Experimental
- [Nature - AI Model Collapse](https://www.nature.com/articles/s41586-024-07566-y)
- [Patterns Journal - Visual Convergence Study](https://www.cell.com/patterns/fulltext/S2666-3899(25)00299-5)
- [IBM - Model Collapse Explained](https://www.ibm.com/think/topics/model-collapse)
- [VentureBeat - AI Feedback Loop Warning](https://venturebeat.com/ai/the-ai-feedback-loop-researchers-warn-of-model-collapse-as-ai-trains-on-ai-generated-content)
- [Dynamic Thresholding Extension](https://github.com/mcmonkeyprojects/sd-dynamic-thresholding)
- [Stable Diffusion Samplers Deep Dive](https://stable-diffusion-art.com/samplers/)
- [Civitai Cursed Images LoRA](https://civitai.com/models/920933/cursed-images-nightmare-fuel-style)
- [Civitai EvilLoRA](https://civitai.com/models/95377/evillora)
- [Civitai Flux Cursed LoRA](https://civitai.com/models/655938/cursed-flux-lora)
- [CLIP Interrogator Repository](https://github.com/pharmapsychotic/clip-interrogator)
- [Textual Inversion / Embeddings Guide](https://aituts.com/textual-inversion/)
- [AI Hallucination Examples](https://journal.everypixel.com/ai-hallucination-examples)
- [SREF Codes - Clone Any Aesthetic](https://medium.com/@ashley-insights/the-secret-number-how-to-find-the-midjourney-sref-code-and-clone-any-aesthetic-d4fb043357c8)
- [img2img Denoising Guide](https://onceuponanalgorithm.org/guide-what-denoising-strength-does-and-how-to-use-it-in-stable-diffusion/)
- [ControlNet OpenPose Discussions](https://github.com/Mikubill/sd-webui-controlnet/discussions/)

---

*This document is part of the Refyn project - an AI prompt optimization tool that learns your taste and helps push creative boundaries.*
