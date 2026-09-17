import { imageKeyFromUrl } from "./parsers";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXTENSIONS = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
} as const;

type ImageExtension = keyof typeof EXTENSIONS;

const EXTENSION_BY_MIME: Record<string, ImageExtension> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type ImageStore = {
  put(
    key: string,
    value: Uint8Array,
    options: { httpMetadata: { contentType: string }; customMetadata: Record<string, string> },
  ): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream } | null>;
};

export type UploadOutcome =
  | { status: 200; url: string }
  | { status: 400 | 413; message: string };

export type ImageOutcome =
  | { status: 200; body: ReadableStream; contentType: string }
  | { status: 404 };

const startsWithBytes = (bytes: Uint8Array, signature: readonly number[]): boolean =>
  signature.every((byte, index) => bytes[index] === byte);

const ascii = (value: string): readonly number[] =>
  Array.from(value, (character) => character.charCodeAt(0));

const sniffExtension = (bytes: Uint8Array): ImageExtension | null => {
  if (bytes.length < 12) return null;
  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWithBytes(bytes, ascii("GIF87a")) || startsWithBytes(bytes, ascii("GIF89a"))) {
    return "gif";
  }
  if (startsWithBytes(bytes, ascii("RIFF")) && startsWithBytes(bytes.subarray(8), ascii("WEBP"))) {
    return "webp";
  }
  return null;
};

const normalizeMime = (contentType: string | null): string => {
  if (contentType === null) return "";
  return contentType.split(";")[0].trim().toLowerCase();
};

type BodyReadOutcome =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: "empty" | "too-large" };

export const readBoundedBody = async (
  stream: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<BodyReadOutcome> => {
  if (stream === null) return { ok: false, reason: "empty" };
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value === undefined) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, reason: "too-large" };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (total === 0) return { ok: false, reason: "empty" };
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
};

export const uploadImage = async (options: {
  images: ImageStore;
  userId: string;
  contentType: string | null;
  body: ReadableStream<Uint8Array> | null;
}): Promise<UploadOutcome> => {
  const declaredMime = normalizeMime(options.contentType);
  const extension = EXTENSION_BY_MIME[declaredMime];
  if (extension === undefined) {
    return { status: 400, message: "Only PNG, JPEG, WebP, or GIF images are supported." };
  }

  const read = await readBoundedBody(options.body, MAX_IMAGE_BYTES);
  if (!read.ok) {
    return read.reason === "too-large"
      ? { status: 413, message: "Images must be smaller than 5 MB." }
      : { status: 400, message: "The uploaded image was empty." };
  }

  const sniffed = sniffExtension(read.bytes);
  if (sniffed === null || sniffed !== extension) {
    return { status: 400, message: "The uploaded file is not a valid image." };
  }

  const key = `${options.userId}/${crypto.randomUUID()}.${extension}`;
  await options.images.put(key, read.bytes, {
    httpMetadata: { contentType: EXTENSIONS[extension] },
    customMetadata: { owner: options.userId },
  });
  return { status: 200, url: `/api/images/${key}` };
};

const matchExtension = (value: string): ImageExtension | null => {
  if (value === "png") return "png";
  if (value === "jpg") return "jpg";
  if (value === "webp") return "webp";
  if (value === "gif") return "gif";
  return null;
};

const parseRequestKey = (
  pathname: string,
  prefix: string,
): { key: string; extension: ImageExtension } | null => {
  if (!pathname.startsWith(prefix)) return null;
  let raw: string;
  try {
    raw = decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    return null;
  }
  const key = imageKeyFromUrl(`/api/images/${raw}`);
  if (key === null) return null;
  const extension = matchExtension(key.slice(key.lastIndexOf(".") + 1));
  if (extension === null) return null;
  return { key, extension };
};

export const readImage = async (options: {
  images: ImageStore;
  userId: string;
  pathname: string;
  prefix: string;
}): Promise<ImageOutcome> => {
  const parsed = parseRequestKey(options.pathname, options.prefix);
  if (parsed === null || !parsed.key.startsWith(`${options.userId}/`)) {
    return { status: 404 };
  }

  const object = await options.images.get(parsed.key);
  if (object === null) return { status: 404 };
  return { status: 200, body: object.body, contentType: EXTENSIONS[parsed.extension] };
};
