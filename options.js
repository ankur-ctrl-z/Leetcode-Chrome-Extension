document.addEventListener("DOMContentLoaded", () => {
  // Load saved key
  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (geminiApiKey) {
      document.getElementById("api-key").value = geminiApiKey;
    }
  });

  // Save button logic
  document.getElementById("save-button").addEventListener("click", () => {
    const apikey = document.getElementById("api-key").value.trim();
    if (!apikey) {
      alert("Please enter a valid API key.");
      return;
    }

    chrome.storage.sync.set({ geminiApiKey: apikey }, () => {
      const status = document.getElementById("success-message");
      status.style.display = "block";
      status.innerText = "Settings saved!";
      setTimeout(() => {
        status.style.display = "none";
      }, 2000);
    });
  });
});