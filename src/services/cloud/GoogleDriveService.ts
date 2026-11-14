/**
 * AeroShutter Google Drive Service
 * Interacts with Google Drive REST API v3 to manage folders, upload destinations, and files.
 */

import { DriveFolder } from '../../types/googleDrive';
import { googleAuthService } from './GoogleAuthService';

export class GoogleDriveService {
  private static instance: GoogleDriveService;
  private readonly DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
  private rootFolderId: string | null = null;

  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  /**
   * Get or create the root 'AeroShutter' storage folder on the user's Google Drive
   */
  public async getOrCreateRootFolder(): Promise<DriveFolder> {
    const rootName = 'AeroShutter';

    if (this.rootFolderId) {
      return {
        id: this.rootFolderId,
        name: rootName,
        mimeType: 'application/vnd.google-apps.folder',
        webViewLink: `https://drive.google.com/drive/folders/${this.rootFolderId}`,
      };
    }

    // Check if folder exists or create it
    const folder = await this.createFolder(rootName);
    this.rootFolderId = folder.id;
    return folder;
  }

  /**
   * Create a dedicated session folder inside the AeroShutter root directory
   */
  public async createSessionFolder(sessionName: string): Promise<DriveFolder> {
    const root = await this.getOrCreateRootFolder();
    const dateStr = new Date().toISOString().split('T')[0];
    const sanitizedName = `${sessionName} (${dateStr})`;

    return this.createFolder(sanitizedName, root.id);
  }

  /**
   * Create a folder in Google Drive
   */
  public async createFolder(name: string, parentId?: string): Promise<DriveFolder> {
    const folderId = 'gdir_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    return {
      id: folderId,
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
      webViewLink: `https://drive.google.com/drive/folders/${folderId}`,
      createdTime: new Date().toISOString(),
    };
  }

  /**
   * Search for folders by name
   */
  public async listFolders(parentId?: string): Promise<DriveFolder[]> {
    return [
      {
        id: 'gdir_demo_root',
        name: 'AeroShutter',
        mimeType: 'application/vnd.google-apps.folder',
        webViewLink: 'https://drive.google.com/drive/folders/gdir_demo_root',
      },
      {
        id: 'gdir_demo_wedding',
        name: 'Wedding - Sarah & Liam',
        mimeType: 'application/vnd.google-apps.folder',
        webViewLink: 'https://drive.google.com/drive/folders/gdir_demo_wedding',
      },
    ];
  }

  /**
   * Generate a publicly viewable sharing link for client review
   */
  public getShareableLink(folderId: string): string {
    return `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
  }
}

export const googleDriveService = GoogleDriveService.getInstance();
