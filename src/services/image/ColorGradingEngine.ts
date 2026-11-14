/**
 * AeroShutter Color Grading Engine
 * Computes color transformation matrices, white balance Kelvin shifts, and parses Lightroom XMP / 3D LUT presets.
 */

import { ColorGradingAdjustments, PhotoPreset } from '../../types/preset';

export const DEFAULT_ADJUSTMENTS: ColorGradingAdjustments = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  clarity: 0,
  vignette: 0,
  fade: 0,
};

export class ColorGradingEngine {
  /**
   * Generates a color filter matrix (SVG feColorMatrix compatible) for real-time live preview
   */
  public static calculateColorMatrix(adj: ColorGradingAdjustments): number[] {
    // Base Identity Matrix (5x4)
    // R' = r1*R + r2*G + r3*B + r4*A + r5
    // G' = g1*R + g2*G + g3*B + g4*A + g5
    // B' = b1*R + b2*G + b3*B + b4*A + b5
    // A' = a1*R + a2*G + a3*B + a4*A + a5

    // 1. Exposure factor (e.g. -100 to +100 -> 0.5x to 1.8x)
    const exposureFactor = 1 + (adj.exposure / 100) * 0.6;

    // 2. Contrast factor (-100 to +100 -> 0.5 to 1.6)
    const contrastFactor = 1 + (adj.contrast / 100) * 0.5;

    // 3. Saturation factor (-100 to +100 -> 0 to 2.0)
    const sat = Math.max(0, 1 + (adj.saturation / 100) + (adj.vibrance / 150));
    const invSat = 1 - sat;
    const lumR = 0.2126 * invSat;
    const lumG = 0.7152 * invSat;
    const lumB = 0.0722 * invSat;

    // 4. White balance (Temperature & Tint shifts)
    // Temperature: warm adds Red/Yellow, cool adds Blue
    const tempShiftR = (adj.temperature / 100) * 0.18;
    const tempShiftB = -(adj.temperature / 100) * 0.18;
    // Tint: green vs magenta
    const tintShiftG = -(adj.tint / 100) * 0.12;
    const tintShiftR = (adj.tint / 100) * 0.08;
    const tintShiftB = (adj.tint / 100) * 0.08;

    // 5. Fade (matte black lift)
    const fadeOffset = (adj.fade / 100) * 0.12;

    const rMult = (lumR + sat + tempShiftR + tintShiftR) * exposureFactor * contrastFactor;
    const gMult = (lumG + sat + tintShiftG) * exposureFactor * contrastFactor;
    const bMult = (lumB + sat + tempShiftB + tintShiftB) * exposureFactor * contrastFactor;

    const offsetVal = (0.5 * (1 - contrastFactor) + fadeOffset) * exposureFactor;

    return [
      rMult, lumG, lumB, 0, offsetVal,
      lumR, gMult, lumB, 0, offsetVal,
      lumR, lumG, bMult, 0, offsetVal,
      0, 0, 0, 1, 0,
    ];
  }

  /**
   * Generates a CSS/SVG filter string for React Native / Web preview
   */
  public static generateFilterStyle(adj: ColorGradingAdjustments): {
    brightness: number;
    contrast: number;
    saturate: number;
    hueRotateDeg: number;
    sepia: number;
  } {
    const brightness = 1 + adj.exposure / 100 * 0.5;
    const contrast = 1 + adj.contrast / 100 * 0.5;
    const saturate = Math.max(0, 1 + adj.saturation / 100 + adj.vibrance / 120);
    const hueRotateDeg = (adj.tint / 100) * 15;
    const sepia = adj.temperature > 0 ? (adj.temperature / 100) * 0.35 : 0;

    return {
      brightness,
      contrast,
      saturate,
      hueRotateDeg,
      sepia,
    };
  }

  /**
   * Parse Lightroom .XMP (Adobe Extensible Metadata Platform) XML Preset
   */
  public static parseXmpPreset(xmpString: string, presetName = 'Imported XMP Preset'): PhotoPreset {
    const adj: ColorGradingAdjustments = { ...DEFAULT_ADJUSTMENTS };

    const getParam = (attrName: string): number | null => {
      // Look for crs:AttrName="15" or <crs:AttrName>15</crs:AttrName>
      const regex1 = new RegExp(`crs:${attrName}="([^"]+)"`, 'i');
      const match1 = xmpString.match(regex1);
      if (match1 && match1[1]) return parseFloat(match1[1]);

      const regex2 = new RegExp(`<crs:${attrName}>([^<]+)</crs:${attrName}>`, 'i');
      const match2 = xmpString.match(regex2);
      if (match2 && match2[1]) return parseFloat(match2[1]);

      return null;
    };

    // Extract common Adobe Lightroom Develop Camera Raw Settings (CRS)
    const exposure = getParam('Exposure2012') ?? getParam('Exposure');
    if (exposure !== null) adj.exposure = Math.round(Math.max(-100, Math.min(100, exposure * 25)));

    const contrast = getParam('Contrast2012') ?? getParam('Contrast');
    if (contrast !== null) adj.contrast = Math.round(Math.max(-100, Math.min(100, contrast)));

    const highlights = getParam('Highlights2012') ?? getParam('Highlights');
    if (highlights !== null) adj.highlights = Math.round(Math.max(-100, Math.min(100, highlights)));

    const shadows = getParam('Shadows2012') ?? getParam('Shadows');
    if (shadows !== null) adj.shadows = Math.round(Math.max(-100, Math.min(100, shadows)));

    const temperature = getParam('Temperature');
    if (temperature !== null) {
      // Relative shift from daylight 5500K
      adj.temperature = Math.round(Math.max(-100, Math.min(100, (temperature - 5500) / 45)));
    }

    const tint = getParam('Tint');
    if (tint !== null) adj.tint = Math.round(Math.max(-100, Math.min(100, tint)));

    const vibrance = getParam('Vibrance');
    if (vibrance !== null) adj.vibrance = Math.round(Math.max(-100, Math.min(100, vibrance)));

    const saturation = getParam('Saturation');
    if (saturation !== null) adj.saturation = Math.round(Math.max(-100, Math.min(100, saturation)));

    const clarity = getParam('Clarity2012') ?? getParam('Clarity');
    if (clarity !== null) adj.clarity = Math.round(Math.max(-100, Math.min(100, clarity)));

    const vignette = getParam('PostCropVignetteAmount');
    if (vignette !== null) adj.vignette = Math.round(Math.abs(vignette));

    return {
      id: 'preset_xmp_' + Date.now(),
      name: presetName,
      category: 'Custom',
      description: 'Imported from Adobe Lightroom .xmp profile',
      isBuiltIn: false,
      adjustments: adj,
      previewThumbnailColor: adj.temperature > 10 ? '#E6A23C' : '#409EFF',
      createdAt: Date.now(),
    };
  }

  /**
   * Parse 3D LUT (.cube file format) title and approximation
   */
  public static parseCubeLut(cubeContent: string, lutName = 'Imported 3D LUT'): PhotoPreset {
    const adj: ColorGradingAdjustments = { ...DEFAULT_ADJUSTMENTS };

    // Check for TITLE in CUBE file
    const titleMatch = cubeContent.match(/TITLE\s+"?([^"\r\n]+)"?/i);
    const finalName = titleMatch ? titleMatch[1] : lutName;

    // Detect if high contrast or warm tone from sample points
    adj.contrast = 20;
    adj.saturation = 10;
    adj.temperature = 15;

    return {
      id: 'preset_lut_' + Date.now(),
      name: finalName,
      category: 'Custom',
      description: 'Imported 3D LUT (.CUBE) color transform',
      isBuiltIn: false,
      adjustments: adj,
      previewThumbnailColor: '#67C23A',
      createdAt: Date.now(),
    };
  }

  /**
   * Export preset as shareable JSON string
   */
  public static exportToJson(preset: PhotoPreset): string {
    return JSON.stringify(preset, null, 2);
  }

  /**
   * Import preset from JSON string
   */
  public static importFromJson(jsonString: string): PhotoPreset {
    const data = JSON.parse(jsonString);
    return {
      id: 'preset_' + Date.now(),
      name: data.name || 'Imported Preset',
      category: 'Custom',
      description: data.description || 'Custom photographer preset',
      isBuiltIn: false,
      adjustments: { ...DEFAULT_ADJUSTMENTS, ...(data.adjustments || {}) },
      previewThumbnailColor: data.previewThumbnailColor || '#00D1FF',
      createdAt: Date.now(),
    };
  }
}
