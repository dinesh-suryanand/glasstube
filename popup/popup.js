const DEFAULTS = { blockAds: true, transparentMode: true, transparency: 0.55, blur: 0 };

const $ = (id) => document.getElementById(id);
const checkboxes = ['blockAds', 'transparentMode'];
const sliders = {
  transparency: (v) => `${Math.round(v * 100)}%`,
  blur: (v) => `${v}px`,
};

chrome.storage.sync.get(DEFAULTS, (s) => {
  for (const id of checkboxes) $(id).checked = s[id];
  for (const [id, format] of Object.entries(sliders)) {
    $(id).value = s[id];
    $(`${id}Value`).textContent = format(s[id]);
  }
});

for (const id of checkboxes) {
  $(id).addEventListener('change', () => chrome.storage.sync.set({ [id]: $(id).checked }));
}
for (const [id, format] of Object.entries(sliders)) {
  $(id).addEventListener('input', () => {
    const value = Number($(id).value);
    $(`${id}Value`).textContent = format(value);
    chrome.storage.sync.set({ [id]: value });
  });
}
