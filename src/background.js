// Keeps the network ad-blocking ruleset in sync with the "Block ads" setting.
async function syncAdRuleset() {
  const { blockAds = true } = await chrome.storage.sync.get('blockAds');
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    blockAds ? { enableRulesetIds: ['ads'] } : { disableRulesetIds: ['ads'] }
  );
}

chrome.runtime.onInstalled.addListener(syncAdRuleset);
chrome.runtime.onStartup.addListener(syncAdRuleset);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && 'blockAds' in changes) syncAdRuleset();
});
