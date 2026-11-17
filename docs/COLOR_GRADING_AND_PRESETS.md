# Lightroom Presets & Color Grading Architecture

AeroShutter integrates an on-device color grading engine inspired by Adobe Lightroom, empowering photographers to enhance tethered camera shots before or during transfer.

---

## 1. Feature Overview

1. **Curated Built-in Presets:**
   - **Portra 400 Film:** Warm, flattering skin tones, gentle contrast, natural highlight roll-off.
   - **Cinematic Warm (Teal & Orange):** Hollywood blockbuster look with warm skin tones and cool cyan shadows.
   - **Moody Monochrome:** Punchy street photography black & white with rich deep blacks and crisp whites.
   - **Nordic Crisp / Clean Commercial:** High key, pure whites, neutral skin tones, crisp micro-contrast.
   - **Golden Hour Glow:** Sun-drenched golden warmth with boosted dynamic range and luminous highlights.
   - **Vintage 70s Matte:** Faded matte blacks, warm amber greens, and nostalgic retro tones.

2. **Custom Preset Upload & Import:**
   - **Adobe Lightroom .XMP:** Supports pasting or importing `.xmp` Camera Raw Setting (CRS) XML files.
   - **3D LUTs (.CUBE):** Imports standard color lookup tables with custom intensity scaling.
   - **JSON Presets:** Shareable and portable preset configuration format.
   - **Save Current Grade:** Save manual slider tweaks directly as a new named custom preset.

3. **Manual Color Grading Tools:**
   - **Tone / Light:** Exposure, Contrast, Highlights, Shadows, Whites, Blacks.
   - **Color / White Balance:** Temperature (Cool ↔ Warm Kelvin shifts), Tint (Green ↔ Magenta), Vibrance, Saturation.
   - **Effects & Detail:** Clarity, Vignette, Matte Fade (black lift).

4. **Flexible Transfer Workflow:**
   - **Transfer RAW Direct:** Bypasses color grading and transfers untouched, pristine raw camera files (`.ARW`, `.CR3`, `.NEF`, `.RAF`, `.DNG`) directly to Google Drive.
   - **Apply Preset & Transfer Graded:** Exports a high-resolution JPEG with baked color profile and uploads to Google Drive.
   - **Dual Transfer (Both):** Uploads both the raw camera sensor file and the enhanced graded preview together into the session folder.

5. **Hold-to-Compare Before/After:**
   - Instant visual comparison button allowing photographers to toggle between the untouched raw capture and the graded version.

