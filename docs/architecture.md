# Architecture

NorthStar has two storage modes behind a client storage boundary. `api` retains the localhost Node service and its atomic filesystem Markdown adapter. `lite` is the recommended static build: React reads and writes an IndexedDB working copy and never calls an API.

The Markdown parser, writer, validation, unknown-frontmatter preservation, and SHA-256 revision function are browser-safe in `packages/markdown-storage/src/core.ts`. The Node-only filesystem adapter imports that core and adds atomic temporary-file/rename writes and filesystem backups.

In Lite mode a file is selected only after a click. A stored File System Access handle is checked without prompting on startup. A missing permission is shown as reconnect-required. Before a direct save, Lite rereads and hashes the file; a changed revision produces a conflict view and preserves the local IndexedDB version. The previous Markdown text is retained as a bounded (10-item) IndexedDB recovery history before every overwrite. The fallback path is ordinary file input plus a Blob download, which is clearly not represented as replacing the original file.

IndexedDB stores profiles, active-profile preference, file bindings where structured cloning is supported, warnings, revisions, dirty state, conflicts, and backups. The UI updates the IndexedDB profile first; Markdown is only marked saved after a complete write, close, reread, and matching SHA-256 verification.

The service worker precaches the static application shell. It does not cache API data in Lite mode. There are no remote fonts, analytics, telemetry, providers, or API keys. A static host receives the application request only; users must trust that host because its delivered JavaScript receives access to files they choose.

Known limits: direct persistent file writing needs the File System Access API (typically Chromium over HTTPS). Firefox and Safari use import/download. Browsers can revoke file permissions, and a download is a new Markdown copy rather than a replacement for an existing file.
