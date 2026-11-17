import { dbManager } from '../../src/database/database';
import { sessionRepo } from '../../src/database/sessionRepository';
import { photoRepo } from '../../src/database/photoRepository';
import { uploadQueueRepo } from '../../src/database/uploadQueueRepository';

describe('AeroShutter Database Persistence Layer', () => {
  beforeEach(async () => {
    await dbManager.resetForTests();
  });

  test('should create, retrieve and set active sessions', async () => {
    const session = await sessionRepo.createSession({
      name: 'Wedding Shoot - Alex & Taylor',
      description: 'Main ceremony and portraits',
    });

    expect(session.id).toBeDefined();
    expect(session.name).toBe('Wedding Shoot - Alex & Taylor');
    expect(session.isActive).toBe(true);

    const retrieved = await sessionRepo.getSessionById(session.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('Wedding Shoot - Alex & Taylor');

    const active = await sessionRepo.getActiveSession();
    expect(active?.id).toBe(session.id);
  });

  test('should insert photos and correctly map EXIF telemetry', async () => {
    const session = await sessionRepo.createSession({ name: 'Studio Test' });

    const photo = await photoRepo.insertPhoto({
      sessionId: session.id,
      fileName: 'DSC_0042.ARW',
      localPath: '/storage/DCIM/DSC_0042.ARW',
      fileSize: 38 * 1024 * 1024,
      mimeType: 'image/x-sony-arw',
      isRaw: true,
      rawFormat: 'ARW',
      width: 7008,
      height: 4672,
      exif: {
        make: 'Sony',
        model: 'ILCE-7M4',
        aperture: 'f/2.8',
        shutterSpeed: '1/500s',
        iso: 100,
        focalLength: '35mm',
      },
    });

    expect(photo.id).toBeDefined();
    expect(photo.isRaw).toBe(true);
    expect(photo.rawFormat).toBe('ARW');

    const photos = await photoRepo.getPhotos({ sessionId: session.id });
    expect(photos.length).toBe(1);
    expect(photos[0].exif?.model).toBe('ILCE-7M4');
    expect(photos[0].exif?.aperture).toBe('f/2.8');
  });

  test('should manage upload queue state lifecycle (enqueue, progress, complete)', async () => {
    const session = await sessionRepo.createSession({ name: 'Queue Test' });
    const photo = await photoRepo.insertPhoto({
      sessionId: session.id,
      fileName: 'DSC_0001.JPG',
      localPath: '/storage/DSC_0001.JPG',
      fileSize: 10 * 1024 * 1024,
      mimeType: 'image/jpeg',
      isRaw: false,
      rawFormat: 'JPEG',
    });

    const task = await uploadQueueRepo.enqueue({
      photoId: photo.id,
      sessionId: session.id,
      fileName: photo.fileName,
      localPath: photo.localPath,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      driveFolderId: 'folder_123',
      status: 'PENDING',
      progressBytes: 0,
      retryCount: 0,
      maxRetries: 5,
    });

    expect(task.status).toBe('PENDING');

    await uploadQueueRepo.updateProgress(task.id, 5 * 1024 * 1024);
    const inProgress = await uploadQueueRepo.getTaskById(task.id);
    expect(inProgress?.status).toBe('UPLOADING');
    expect(inProgress?.progressPercentage).toBe(50);

    await uploadQueueRepo.markCompleted(task.id, 'gdrive_file_999');
    const completed = await uploadQueueRepo.getTaskById(task.id);
    expect(completed?.status).toBe('COMPLETED');
    expect(completed?.driveFileId).toBe('gdrive_file_999');
  });
});

