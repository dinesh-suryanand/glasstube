// GlassTube: ad blocking + transparent watch page.
// The normal YouTube player stays untouched; its frames are painted onto a
// canvas behind the see-through page (see content.css).
// YouTube enforces Trusted Types, so all DOM is built without innerHTML.
(() => {
  const DEFAULTS = { blockAds: true, transparentMode: true, transparency: 0.55, blur: 0 };
  const root = document.documentElement;
  let settings = { ...DEFAULTS };

  const getPlayer = () => document.getElementById('movie_player');
  const getVideo = () => document.querySelector('#movie_player video');

  // ---------- Ads ----------

  const SKIP_BUTTONS =
    '.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-overlay-close-button';
  const AD_RATE = 16;
  let mutedByUs = false;
  let contentRate = 1;

  function handleAds() {
    const player = getPlayer();
    const video = getVideo();
    if (!player || !video) return;

    const adShowing = player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting');
    if (adShowing && settings.blockAds) {
      document.querySelectorAll(SKIP_BUTTONS).forEach((b) => b.click());
      if (!video.muted) {
        video.muted = true;
        mutedByUs = true;
      }
      if (video.playbackRate !== AD_RATE) video.playbackRate = AD_RATE;
      if (Number.isFinite(video.duration) && video.currentTime < video.duration - 0.25) {
        video.currentTime = video.duration - 0.1;
      }
    } else if (!adShowing) {
      if (mutedByUs) {
        video.muted = false;
        mutedByUs = false;
      }
      if (video.playbackRate === AD_RATE) video.playbackRate = contentRate;
      else contentRate = video.playbackRate;
    }
  }

  // ---------- Transparent page (background copy) ----------
  // Each new frame of the real video is painted onto a canvas behind the page
  // (like YouTube's own Ambient mode). requestVideoFrameCallback only fires on
  // new frames, so pausing the video freezes the background too.
  // Note: video.captureStream() is NOT used — it stops Chrome drawing the
  // original player.

  const MAX_BACKDROP_WIDTH = 640; // low-res is plenty for a full-page background
  let backdrop = null; // { canvas, ctx, video, handle, lastDraw }

  function paint() {
    if (!backdrop) return;
    const { canvas, ctx, video } = backdrop;
    if (!video.videoWidth) return;
    const width = Math.min(MAX_BACKDROP_WIDTH, video.videoWidth);
    const height = Math.round((width * video.videoHeight) / video.videoWidth);
    if (canvas.width !== width || canvas.height !== height) Object.assign(canvas, { width, height });
    // Copy-protected (DRM) videos just draw black, leaving a plain dark page.
    ctx.drawImage(video, 0, 0, width, height);
    backdrop.lastDraw = performance.now();
  }

  function onVideoFrame() {
    paint();
    if (backdrop) backdrop.handle = backdrop.video.requestVideoFrameCallback(onVideoFrame);
  }

  function removeBackdrop() {
    if (!backdrop) return;
    backdrop.video.cancelVideoFrameCallback(backdrop.handle);
    backdrop.video.removeEventListener('seeked', paint);
    backdrop.canvas.remove();
    backdrop = null;
  }

  function updateTransparentMode() {
    const video = getVideo();
    const active = settings.transparentMode && location.pathname === '/watch' && !!video && !!document.body;
    root.classList.toggle('dyt-transparent', active);
    if (!active) {
      removeBackdrop();
      return;
    }
    if (backdrop?.video === video) {
      // Fallback in case frame callbacks stall (e.g. Chrome throttling).
      if (!video.paused && performance.now() - backdrop.lastDraw > 500) paint();
      return;
    }
    removeBackdrop();
    const canvas = document.createElement('canvas');
    canvas.className = 'dyt-backdrop';
    document.body.prepend(canvas);
    backdrop = { canvas, ctx: canvas.getContext('2d'), video, handle: 0, lastDraw: 0 };
    video.addEventListener('seeked', paint); // seeking while paused updates the background
    onVideoFrame();
  }

  // ---------- Wiring ----------

  function applySettings() {
    root.classList.toggle('dyt-hide-ads', settings.blockAds);
    root.style.setProperty('--dyt-panel-alpha', String(1 - settings.transparency));
    root.style.setProperty('--dyt-panel-blur', `${settings.blur}px`);
    updateTransparentMode();
  }

  document.addEventListener('keydown', (e) => {
    if (!e.altKey || e.code !== 'KeyT') return;
    const t = e.target;
    if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    chrome.storage.sync.set({ transparentMode: !settings.transparentMode });
  });

  setInterval(() => {
    handleAds();
    updateTransparentMode();
  }, 250);

  applySettings();
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = { ...DEFAULTS, ...stored };
    applySettings();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const [key, { newValue }] of Object.entries(changes)) settings[key] = newValue;
    applySettings();
  });
})();
