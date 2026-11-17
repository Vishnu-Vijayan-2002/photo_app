import { dbManager } from '../../src/database/database';
import { uploadQueueManager } from '../../src/services/queue/UploadQueueManager';
import { sessionRepo } from '../../src/database/sessionRepository';
import { photoRepo } from '../../src/database/photoRepository';

describe('AeroShutter Upload Queue Manager', () => {
  beforeEach(async () => {
    await dbManager.resetForTests();
  });

  test('should enqueue photo and update queue metrics', async () => {
    const session = await sessionRepo.createSession({ name: 'Automated Shoot' });
    const photo = await photoRepo.insertPhoto({
      sessionId: session.id,
      fileName: 'DSC_0099.ARW',
      localPath: '/storage/DSC_0099.ARW',
      fileSize: 40 * 1024 * 1024,
      mimeType: 'image/x-sony-arw',
      isRaw: true,
      rawFormat: 'ARW',
    });

    const task = await uploadQueueManager.enqueuePhoto(photo);
    expect(task).toBeDefined();
    expect(task.fileName).toBe('DSC_0099.ARW');

    const state = await uploadQueueManager.getState();
    expect(state.tasks.length).toBeGreaterThanOrEqual(1);
  });

  test('should pause and resume queue', async () => {
    uploadQueueManager.pause();
    let state = await uploadQueueManager.getState();
    expect(state.isPaused).toBe(true);

    uploadQueueManager.resume();
    state = await uploadQueueManager.getState();
    expect(state.isPaused).toBe(false);
  });
});

