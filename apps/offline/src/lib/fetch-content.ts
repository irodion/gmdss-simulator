/**
 * Fetch a static JSON file from the mirrored `/content` tree. These files are
 * precached by the service worker (the offline workbox glob includes `json`),
 * so a plain fetch resolves offline too. Shared by the content/exam loaders.
 */
export async function fetchContentJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}
