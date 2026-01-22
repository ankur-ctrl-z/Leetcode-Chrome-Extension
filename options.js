document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["geminiApiKey"], (res) => {
    if (res.geminiApiKey) {
      document.getElementById("api-key").value = res.geminiApiKey;
    }
  });

  document.getElementById("save-button").addEventListener("click", () => {
    const key = document.getElementById("api-key").value.trim();
    if (!key) return;

    chrome.storage.sync.set({ geminiApiKey: key }, () => {
      document.getElementById("success-message").style.display = "block";
      setTimeout(() => window.close(), 1200);
    });
  });
});
