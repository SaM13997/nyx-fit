import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, readImage, uploadImage, type ImageStore } from "./images.server";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const PREFIX = "/api/images/";

const withHeader = (header: readonly number[], size = 32): Uint8Array<ArrayBuffer> => {
  const bytes = new Uint8Array(size);
  bytes.set(header);
  return bytes;
};

const ascii = (value: string): readonly number[] =>
  Array.from(value, (character) => character.charCodeAt(0));

const pngBytes = (size?: number) =>
  withHeader([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], size);
const jpegBytes = (size?: number) => withHeader([0xff, 0xd8, 0xff], size);
const gifBytes = (size?: number) => withHeader(ascii("GIF89a"), size);
const webpBytes = (size = 32) => {
  const bytes = new Uint8Array(size);
  bytes.set(ascii("RIFF"));
  bytes.set(ascii("WEBP"), 8);
  return bytes;
};
const svgBytes = (size = 64) => withHeader(ascii("<svg xmlns="), size);

type StoredObject = { bytes: Uint8Array<ArrayBuffer>; contentType: string };

const createImageStore = () => {
  const objects = new Map<string, StoredObject>();
  const store: ImageStore = {
    put: async (key, value, options) => {
      objects.set(key, {
        bytes: new Uint8Array(value),
        contentType: options.httpMetadata.contentType,
      });
    },
    get: async (key) => {
      const object = objects.get(key);
      if (object === undefined) return null;
      const body = new Response(object.bytes).body;
      if (body === null) throw new Error("expected a readable body");
      return { body };
    },
  };
  return { store, objects };
};

const bodyOf = (bytes: Uint8Array<ArrayBuffer>): ReadableStream<Uint8Array> => {
  const body = new Response(bytes).body;
  if (body === null) throw new Error("expected a readable body");
  return body;
};

const readBody = async (body: ReadableStream): Promise<Uint8Array> =>
  new Uint8Array(await new Response(body).arrayBuffer());

describe("image uploads", () => {
  it("stores a signed raster image under the owner prefix", async () => {
    const { store, objects } = createImageStore();
    const outcome = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "image/png",
      body: bodyOf(pngBytes()),
    });

    expect(outcome.status).toBe(200);
    if (outcome.status !== 200) throw new Error("expected an upload");
    expect(outcome.url).toMatch(
      new RegExp(`^/api/images/${USER_A}/[0-9a-f-]{36}\\.png$`),
    );
    const key = outcome.url.slice(PREFIX.length);
    expect(objects.get(key)?.contentType).toBe("image/png");
    expect(objects.get(key)?.bytes.byteLength).toBe(32);
  });

  it("accepts jpeg, webp, and gif payloads", async () => {
    const { store } = createImageStore();
    const jpeg = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "image/jpeg; charset=binary",
      body: bodyOf(jpegBytes()),
    });
    const webp = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "image/webp",
      body: bodyOf(webpBytes()),
    });
    const gif = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "image/gif",
      body: bodyOf(gifBytes()),
    });
    expect(jpeg).toMatchObject({ status: 200 });
    expect(webp).toMatchObject({ status: 200 });
    expect(gif).toMatchObject({ status: 200 });
  });

  it("rejects unsupported and unsafe image types", async () => {
    const { store, objects } = createImageStore();
    const svg = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "image/svg+xml",
      body: bodyOf(svgBytes()),
    });
    const html = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "text/html",
      body: bodyOf(svgBytes()),
    });
    expect(svg.status).toBe(400);
    expect(html.status).toBe(400);
    expect(objects.size).toBe(0);
  });

  it("rejects payloads whose bytes do not match the declared type", async () => {
    const { store, objects } = createImageStore();
    const disguised = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "image/png",
      body: bodyOf(jpegBytes()),
    });
    const script = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "image/png",
      body: bodyOf(svgBytes()),
    });
    expect(disguised.status).toBe(400);
    expect(script.status).toBe(400);
    expect(objects.size).toBe(0);
  });

  it("rejects empty and oversized bodies without storing them", async () => {
    const { store, objects } = createImageStore();
    const empty = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "image/png",
      body: bodyOf(new Uint8Array(0)),
    });
    const oversized = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "image/png",
      body: bodyOf(pngBytes(MAX_IMAGE_BYTES + 1)),
    });
    expect(empty.status).toBe(400);
    expect(oversized.status).toBe(413);
    expect(objects.size).toBe(0);
  });

  it("rejects a missing body", async () => {
    const { store } = createImageStore();
    const outcome = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "image/png",
      body: null,
    });
    expect(outcome.status).toBe(400);
  });
});

describe("image reads", () => {
  it("serves objects under the owner prefix", async () => {
    const { store } = createImageStore();
    const upload = await uploadImage({
      images: store,
      userId: USER_A,
      contentType: "image/png",
      body: bodyOf(pngBytes()),
    });
    if (upload.status !== 200) throw new Error("expected an upload");

    const outcome = await readImage({
      images: store,
      userId: USER_A,
      pathname: new URL(upload.url, "https://example.com").pathname,
      prefix: PREFIX,
    });
    expect(outcome.status).toBe(200);
    if (outcome.status !== 200) throw new Error("expected an image");
    expect(outcome.contentType).toBe("image/png");
    expect((await readBody(outcome.body)).byteLength).toBe(32);
  });

  it("hides objects owned by another account", async () => {
    const { store } = createImageStore();
    const upload = await uploadImage({
      images: store,
      userId: USER_B,
      contentType: "image/png",
      body: bodyOf(pngBytes()),
    });
    if (upload.status !== 200) throw new Error("expected an upload");

    const outcome = await readImage({
      images: store,
      userId: USER_A,
      pathname: upload.url,
      prefix: PREFIX,
    });
    expect(outcome.status).toBe(404);
  });

  it("rejects malformed and unsupported keys", async () => {
    const { store } = createImageStore();
    const keys = [
      `${PREFIX}${USER_A}/photo.php`,
      `${PREFIX}${USER_A}/photo.svg`,
      `${PREFIX}${USER_A}/nested/photo.png`,
      `${PREFIX}../secret.png`,
      `${PREFIX}${USER_A}/photo.png%20`,
      "/api/other/key.png",
    ];
    for (const pathname of keys) {
      const outcome = await readImage({ images: store, userId: USER_A, pathname, prefix: PREFIX });
      expect(outcome.status).toBe(404);
    }
  });

  it("returns 404 for missing objects", async () => {
    const { store } = createImageStore();
    const outcome = await readImage({
      images: store,
      userId: USER_A,
      pathname: `${PREFIX}${USER_A}/missing.png`,
      prefix: PREFIX,
    });
    expect(outcome.status).toBe(404);
  });
});
