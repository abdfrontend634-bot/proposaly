// Lets the app activate a waiting service worker on user request ("Update Now").
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
