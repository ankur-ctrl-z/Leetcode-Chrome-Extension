document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["groqApiKey"], (data) => {
    if (data.groqApiKey) document.getElementById("api-key").value = data.groqApiKey;
  });

  document.getElementById("save-btn").addEventListener("click", () => {
    const key = document.getElementById("api-key").value.trim();
    if (!key) return;
    chrome.storage.sync.set({ groqApiKey: key }, () => {
      document.getElementById("status").style.display = "block";
      setTimeout(() => window.close(), 1000);
    });
  });
});