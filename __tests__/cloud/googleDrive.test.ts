import { googleDriveService } from '../../src/services/cloud/GoogleDriveService';
import { googleAuthService } from '../../src/services/cloud/GoogleAuthService';
import { resumableUploader } from '../../src/services/cloud/ResumableUploader';
import { UploadTask } from '../../src/types/upload';

describe('Google Drive Cloud Integration', () => {
  test('should authenticate user and return valid access token', async () => {
    const account = await googleAuthService.signIn();
    expect(account).toBeDefined();
    expect(account.email).toContain('@');

    const token = await googleAuthService.getValidAccessToken();
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(10);
  });

  test('should create and retrieve session folders', async () => {
    const root = await googleDriveService.getOrCreateRootFolder();
    expect(root.name).toBe('AeroShutter');

    const sessionFolder = await googleDriveService.createSessionFolder('Fashion Lookbook');
    expect(sessionFolder.name).toContain('Fashion Lookbook');
    expect(sessionFolder.webViewLink).toBeDefined();
  });

  test('should execute resumable chunked upload with progress events', async () => {
    const dummyTask: UploadTask = {
      id: 'task_unit_test_001',
      photoId: 'photo_001',
      sessionId: 'sess_001',
      fileName: 'DSC_0001.JPG',
      localPath: '/storage/DSC_0001.JPG',
      fileSize: 2 * 1024 * 1024,
      mimeType: 'image/jpeg',
      driveFolderId: 'folder_001',
      status: 'PENDING',
      progressBytes: 0,
      progressPercentage: 0,
      retryCount: 0,
      maxRetries: 5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const sessionUri = await resumableUploader.initiateSession(dummyTask);
    expect(sessionUri).toContain('resumable');

    let lastProgress = 0;
    const result = await resumableUploader.upload(dummyTask, (progress) => {
      expect(progress.percentage).toBeGreaterThanOrEqual(lastProgress);
      lastProgress = progress.percentage;
    });

    expect(result.driveFileId).toBeDefined();
    expect(lastProgress).toBe(100);
  });
});
