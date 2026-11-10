# FULLTOSS Sports Arena

A standalone responsive sports fixtures frontend. This project is separate from FULLTOSS LIVE and FULLTOSS FC.

## Automatic feed
The supplied events.json is a saved snapshot, not a live API. Its ttl field does not make a local file update itself. Set `feedUrl` in config.js to a continuously updating JSON API endpoint returning the same structure. Configure CORS on that API for this website's origin. Keep credentials and provider secrets server-side; never commit private feed URLs or raw stream lists to a public repository.

## Playback
HLS playback uses hls.js where supported, with native playback fallback. Expired URLs, provider CORS restrictions, unsupported formats and DRM authorization cannot be bypassed. Only use streams you are authorized to distribute.

Deploy the repository root as a static site; no build step required.