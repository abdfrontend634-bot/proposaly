export function renderErrorPage(status: 404 | 500 = 500): string {
  const isNotFound = status === 404;
  const title = isNotFound ? "Page not found" : "Something went wrong";
  const heading = isNotFound ? "Page not found" : "This page didn't load";
  const body = isNotFound
    ? "The page you're looking for doesn't exist or has moved."
    : "Something went wrong on our end. You can try refreshing or head back home.";
  const primary = isNotFound
    ? `<a class="primary" href="/">Go home</a>`
    : `<button class="primary" onclick="location.reload()">Try again</button>
       <a class="secondary" href="/">Go home</a>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title} — Gigify</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <style>
      body { font: 15px/1.5 'Inter', system-ui, -apple-system, sans-serif; background: #FAFAF7; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      .code { font-size: 0.75rem; letter-spacing: 0.1em; color: #6B7280; text-transform: uppercase; margin-bottom: 0.5rem; }
      h1 { font-size: 1.5rem; margin: 0 0 0.5rem; font-weight: 600; }
      p { color: #6B7280; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.55rem 1rem; border-radius: 0.5rem; font: inherit; font-weight: 500; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #2563EB; color: #fff; }
      .primary:hover { background: #1D4ED8; }
      .secondary { background: #fff; color: #111; border-color: #E5E7EB; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="code">Error ${status}</div>
      <h1>${heading}</h1>
      <p>${body}</p>
      <div class="actions">${primary}</div>
    </div>
  </body>
</html>`;
}
