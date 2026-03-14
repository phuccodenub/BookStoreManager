import { describe, expect, test } from 'vitest';

import {
  buildPublicFileUrl,
  resolveUploadExtension,
} from '../../../src/shared/storage/upload.js';

describe('upload helpers', () => {
  test('buildPublicFileUrl always uses forward slashes', () => {
    expect(
      buildPublicFileUrl('http://localhost:4000', 'uploads', 'avatar.png'),
    ).toBe('http://localhost:4000/uploads/avatar.png');
  });

  test('resolveUploadExtension rejects mismatched extensions', () => {
    expect(() =>
      resolveUploadExtension({
        mimetype: 'image/png',
        originalname: 'avatar.html',
      }),
    ).toThrow('does not match its MIME type');
  });
});
