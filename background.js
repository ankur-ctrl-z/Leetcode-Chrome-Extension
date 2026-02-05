chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["groqApiKey"], (data) => {
    if (!data.groqApiKey) chrome.runtime.openOptionsPage();
  });
});