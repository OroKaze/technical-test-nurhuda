import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface ProfilePhotoUpload {
  mimetype: string;
  originalname: string;
  size: number;
  buffer: Buffer;
}

export interface StoredProfilePhoto {
  filename: string;
  url: string;
}

export class InvalidProfilePhotoError extends Error {
  readonly code = 'INVALID_PROFILE_PHOTO';

  constructor(message = 'The profile photo is invalid.') {
    super(message);
  }
}

const extensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export class ProfilePhotoStorage {
  constructor(
    private readonly rootDirectory: string,
    private readonly maxBytes = 5 * 1024 * 1024,
  ) {}

  async store(upload: ProfilePhotoUpload): Promise<StoredProfilePhoto> {
    const extension = extensions[upload.mimetype];
    if (!extension) throw new InvalidProfilePhotoError('Only JPEG, PNG, and WebP images are accepted.');
    if (upload.size > this.maxBytes || upload.buffer.length > this.maxBytes) {
      throw new InvalidProfilePhotoError('The profile photo exceeds the maximum size.');
    }

    const filename = `${randomUUID()}${extension}`;
    const directory = join(this.rootDirectory, 'profile');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), upload.buffer, { flag: 'wx' });

    return { filename, url: `/uploads/profile/${filename}` };
  }
}
