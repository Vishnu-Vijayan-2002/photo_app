/**
 * AeroShutter Preset Manager Service
 * Curated built-in presets, custom user preset persistence, and transfer workflows.
 */

import { PhotoPreset, ColorGradingAdjustments, TransferChoice } from '../../types/preset';
import { DEFAULT_ADJUSTMENTS } from '../image/ColorGradingEngine';

export const BUILT_IN_PRESETS: PhotoPreset[] = [
  {
    id: 'preset_none',
    name: 'Original (No Grade)',
    category: 'Film',
    description: 'Raw camera output without color grading alterations',
    isBuiltIn: true,
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    previewThumbnailColor: '#606266',
    createdAt: 0,
  },
  {
    id: 'preset_portra_400',
    name: 'Portra 400 Film',
    category: 'Portrait',
    description: 'Kodak Portra classic: warm flattering skin tones, gentle contrast, soft highlights',
    isBuiltIn: true,
    adjustments: {
      exposure: 5,
      contrast: 8,
      highlights: -15,
      shadows: 18,
      whites: 5,
      blacks: 12,
      temperature: 14,
      tint: -4,
      vibrance: 12,
      saturation: -6,
      clarity: 4,
      vignette: 12,
      fade: 10,
    },
    previewThumbnailColor: '#F56C6C',
    createdAt: 0,
  },
  {
    id: 'preset_cinematic_teal_orange',
    name: 'Cinematic Warm',
    category: 'Cinematic',
    description: 'Blockbuster movie look with warm golden highlights and cool cyan shadows',
    isBuiltIn: true,
    adjustments: {
      exposure: 0,
      contrast: 22,
      highlights: 12,
      shadows: -14,
      whites: 8,
      blacks: -10,
      temperature: 20,
      tint: 8,
      vibrance: 25,
      saturation: 8,
      clarity: 15,
      vignette: 25,
      fade: 5,
    },
    previewThumbnailColor: '#E6A23C',
    createdAt: 0,
  },
  {
    id: 'preset_moody_mono',
    name: 'Moody Monochrome',
    category: 'Monochrome',
    description: 'Punchy street photography black & white with rich deep blacks and crisp whites',
    isBuiltIn: true,
    adjustments: {
      exposure: 4,
      contrast: 35,
      highlights: -10,
      shadows: -18,
      whites: 15,
      blacks: -20,
      temperature: 0,
      tint: 0,
      vibrance: -100,
      saturation: -100,
      clarity: 25,
      vignette: 30,
      fade: 8,
    },
    previewThumbnailColor: '#303133',
    createdAt: 0,
  },
  {
    id: 'preset_nordic_crisp',
    name: 'Nordic Clean',
    category: 'Commercial',
    description: 'Ultra-clean commercial look: pure whites, neutral skin tones, crisp micro-contrast',
    isBuiltIn: true,
    adjustments: {
      exposure: 8,
      contrast: 10,
      highlights: -8,
      shadows: 12,
      whites: 12,
      blacks: -5,
      temperature: -8,
      tint: 2,
      vibrance: 15,
      saturation: -4,
      clarity: 10,
      vignette: 0,
      fade: 0,
    },
    previewThumbnailColor: '#409EFF',
    createdAt: 0,
  },
  {
    id: 'preset_golden_hour',
    name: 'Golden Hour Glow',
    category: 'Landscape',
    description: 'Sun-drenched golden warmth with boosted dynamic range and luminous highlights',
    isBuiltIn: true,
    adjustments: {
      exposure: 6,
      contrast: 14,
      highlights: -20,
      shadows: 25,
      whites: 10,
      blacks: 5,
      temperature: 32,
      tint: 6,
      vibrance: 22,
      saturation: 8,
      clarity: 8,
      vignette: 18,
      fade: 6,
    },
    previewThumbnailColor: '#FFBA00',
    createdAt: 0,
  },
  {
    id: 'preset_vintage_70s',
    name: 'Vintage 70s Matte',
    category: 'Film',
    description: 'Retro nostalgic film look with lifted matte blacks and warm amber greens',
    isBuiltIn: true,
    adjustments: {
      exposure: -2,
      contrast: -8,
      highlights: -25,
      shadows: 22,
      whites: -10,
      blacks: 28,
      temperature: 18,
      tint: -10,
      vibrance: -8,
      saturation: -12,
      clarity: -6,
      vignette: 28,
      fade: 32,
    },
    previewThumbnailColor: '#909399',
    createdAt: 0,
  },
];

export class PresetManager {
  private static instance: PresetManager;
  private customPresets: PhotoPreset[] = [];
  private defaultTransferChoice: TransferChoice = 'GRADED_PRESET';
  private autoApplyPresetId: string | null = null;
  private listeners: Set<() => void> = new Set();

  public static getInstance(): PresetManager {
    if (!PresetManager.instance) {
      PresetManager.instance = new PresetManager();
    }
    return PresetManager.instance;
  }

  public getAllPresets(): PhotoPreset[] {
    return [...BUILT_IN_PRESETS, ...this.customPresets];
  }

  public getPresetById(id: string): PhotoPreset | undefined {
    return this.getAllPresets().find((p) => p.id === id);
  }

  public saveCustomPreset(name: string, adjustments: ColorGradingAdjustments, description = ''): PhotoPreset {
    const newPreset: PhotoPreset = {
      id: 'custom_preset_' + Date.now(),
      name,
      category: 'Custom',
      description: description || 'Custom user grade',
      isBuiltIn: false,
      adjustments: { ...adjustments },
      previewThumbnailColor: adjustments.temperature > 0 ? '#E6A23C' : '#409EFF',
      createdAt: Date.now(),
    };

    this.customPresets.push(newPreset);
    this.notify();
    return newPreset;
  }

  public addImportedPreset(preset: PhotoPreset): void {
    this.customPresets.push(preset);
    this.notify();
  }

  public deleteCustomPreset(id: string): boolean {
    const idx = this.customPresets.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.customPresets.splice(idx, 1);
      this.notify();
      return true;
    }
    return false;
  }

  public setDefaultTransferChoice(choice: TransferChoice): void {
    this.defaultTransferChoice = choice;
  }

  public getDefaultTransferChoice(): TransferChoice {
    return this.defaultTransferChoice;
  }

  public setAutoApplyPresetId(presetId: string | null): void {
    this.autoApplyPresetId = presetId;
    this.notify();
  }

  public getAutoApplyPresetId(): string | null {
    return this.autoApplyPresetId;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error notifying preset listener', err);
      }
    });
  }
}

export const presetManager = PresetManager.getInstance();
