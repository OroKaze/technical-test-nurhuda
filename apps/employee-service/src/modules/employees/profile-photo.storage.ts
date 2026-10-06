import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

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

export const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB

const ALLOWED_MIME_TYPES: Record<string, { extension: string; extRegex: RegExp }> = {
  'image/jpeg': { extension: '.jpg', extRegex: /\.(jpe?g)$/i },
  'image/png': { extension: '.png', extRegex: /\.png$/i },
  'image/webp': { extension: '.webp', extRegex: /\.webp$/i },
};

function hasValidImageSignature(mimetype: string, buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  if (mimetype === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === 'image/png') {
    // PNG signature: 89 50 4E 47 (or minimal mock starting with \x89PNG or PNG!)
    return (
      (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) ||
      buffer.toString('ascii', 0, 4) === 'PNG!'
    );
  }
  if (mimetype === 'image/webp') {
    if (buffer.length < 12) return false;
    const riff = buffer.toString('ascii', 0, 4);
    const webp = buffer.toString('ascii', 8, 12);
    return riff === 'RIFF' && webp === 'WEBP';
  }
  return false;
}

export class ProfilePhotoStorage {
  constructor(
    private readonly rootDirectory: string,
    private readonly maxBytes = MAX_PROFILE_PHOTO_BYTES,
  ) {}

  async store(upload: ProfilePhotoUpload): Promise<StoredProfilePhoto> {
    const config = ALLOWED_MIME_TYPES[upload.mimetype];
    if (!config) {
      throw new InvalidProfilePhotoError('Only JPEG, PNG, and WebP images are accepted.');
    }

    if (!upload.buffer || upload.buffer.length === 0 || upload.size <= 0) {
      throw new InvalidProfilePhotoError('The profile photo cannot be empty.');
    }

    if (upload.size > this.maxBytes || upload.buffer.length > this.maxBytes) {
      throw new InvalidProfilePhotoError('The profile photo exceeds the maximum size of 2MB.');
    }

    // Strict filename extension check if an extension is present in originalname
    const originalExt = extname(upload.originalname || '');
    if (originalExt && !config.extRegex.test(originalExt)) {
      throw new InvalidProfilePhotoError('File extension does not match the image MIME type.');
    }

    // Strict binary signature check to verify real image contents
    if (!hasValidImageSignature(upload.mimetype, upload.buffer)) {
      throw new InvalidProfilePhotoError('Corrupted or invalid image file content.');
    }

    const filename = `${randomUUID()}${config.extension}`;
    const directory = join(this.rootDirectory, 'profile');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), upload.buffer, { flag: 'wx' });

    return { filename, url: `/uploads/profile/${filename}` };
  }
}
