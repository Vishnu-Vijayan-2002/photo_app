/**
 * AeroShutter Preset & Color Grading Type Definitions
 */

export interface ColorGradingAdjustments {
  // Light / Tone
  exposure: number;       // -100 to +100 (EV equivalent -2.0 to +2.0)
  contrast: number;       // -100 to +100
  highlights: number;     // -100 to +100
  shadows: number;        // -100 to +100
  whites: number;         // -100 to +100
  blacks: number;         // -100 to +100

  // Color / White Balance
  temperature: number;    // -100 (Cool/Blue) to +100 (Warm/Amber)
  tint: number;           // -100 (Green) to +100 (Magenta)
  vibrance: number;       // -100 to +100
  saturation: number;     // -100 to +100

  // Effects & Detail
  clarity: number;        // -100 to +100
  vignette: number;       // 0 to 100
  fade: number;           // 0 to 100 (matte film lift)
}

export type PresetCategory = 'Cinematic' | 'Portrait' | 'Film' | 'Monochrome' | 'Landscape' | 'Custom';

export interface PhotoPreset {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  isBuiltIn: boolean;
  adjustments: ColorGradingAdjustments;
  previewThumbnailColor?: string;
  author?: string;
  createdAt: number;
}

export type TransferChoice = 'RAW_ORIGINAL' | 'GRADED_PRESET' | 'BOTH_RAW_AND_GRADED';

export interface GradedPhotoExport {
  originalPhotoId: string;
  presetId?: string;
  adjustments: ColorGradingAdjustments;
  exportPath: string;
  exportMimeType: string;
  transferChoice: TransferChoice;
}
