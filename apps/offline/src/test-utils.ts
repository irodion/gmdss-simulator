export function setUserAgent(value: string): void {
  Object.defineProperty(navigator, "userAgent", { configurable: true, get: () => value });
}

export function setMatchMedia(matches: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches,
      media: "",
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}
