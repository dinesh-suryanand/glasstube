// GlassTube: ad blocking + transparent watch page.
// The normal YouTube player stays untouched; a muted live copy of the video
// (captureStream, so it pauses/seeks with the real player) plays behind the
// see-through page (see content.css).
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

  let backdropVideo = null;
  let captureFailedSrc = null;

  const hasLiveStream = (v) => v.srcObject?.getVideoTracks().some((t) => t.readyState === 'live');

  function updateTransparentMode() {
    const video = getVideo();
    const active = settings.transparentMode && location.pathname === '/watch' && !!video && !!document.body;
    root.classList.toggle('dyt-transparent', active);
    if (!active) {
      backdropVideo?.parentElement.remove();
      backdropVideo = null;
      return;
    }
    if (!backdropVideo) {
      const wrap = document.createElement('div');
      wrap.className = 'dyt-backdrop';
      backdropVideo = document.createElement('video');
      Object.assign(backdropVideo, { muted: true, autoplay: true, playsInline: true });
      wrap.append(backdropVideo);
      document.body.prepend(wrap);
    }
    if (hasLiveStream(backdropVideo) || video.readyState < 2 || captureFailedSrc === video.src) return;
    try {
      backdropVideo.srcObject = video.captureStream();
      backdropVideo.play().catch(() => {});
    } catch (err) {
      // DRM-protected videos can't be captured; the page stays plain dark.
      captureFailedSrc = video.src;
    }
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
