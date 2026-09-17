const IMAGES_ENDPOINT = "/api/images";

const UPLOAD_ERROR = "Image upload failed. Please try again.";

type UploadedImage = {
  url: string;
};

const isUploadedImage = (value: unknown): value is UploadedImage =>
  typeof value === "object" &&
  value !== null &&
  "url" in value &&
  typeof value.url === "string" &&
  value.url.length > 0;

type UploadError = {
  error: string;
};

const isUploadError = (value: unknown): value is UploadError =>
  typeof value === "object" &&
  value !== null &&
  "error" in value &&
  typeof value.error === "string" &&
  value.error.length > 0;

export async function uploadImageFile(file: File): Promise<string> {
  const response = await fetch(IMAGES_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(UPLOAD_ERROR);
  }

  if (!response.ok) {
    throw new Error(isUploadError(payload) ? payload.error : UPLOAD_ERROR);
  }

  if (!isUploadedImage(payload)) {
    throw new Error(UPLOAD_ERROR);
  }

  return payload.url;
}
