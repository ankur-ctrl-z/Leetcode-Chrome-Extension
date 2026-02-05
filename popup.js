document.addEventListener("DOMContentLoaded", async () => {
  const themeCheckbox = document.getElementById("theme-checkbox");
  const resultDiv = document.getElementById("result");
  
  // 1. Load Settings
  const storage = await chrome.storage.sync.get(["theme", "groqApiKey"]);
  
  // Apply Dark Mode if saved
  if (storage.theme === "dark") {
    document.body.setAttribute("data-theme", "dark");
    themeCheckbox.checked = true;
  }

  // 2. Theme Toggle Logic
  themeCheckbox.addEventListener("change", () => {
    if (themeCheckbox.checked) {
      document.body.setAttribute("data-theme", "dark");
      chrome.storage.sync.set({ theme: "dark" });
    } else {
      document.body.removeAttribute("data-theme");
      chrome.storage.sync.set({ theme: "light" });
    }
  });

  // 3. Hint Logic
  document.getElementById("hint").addEventListener("click", async () => {
    const type = document.getElementById("Hint-type").value;
    
    if (!storage.groqApiKey) {
      resultDiv.innerText = "Error: API Key missing. Check Options.";
      return;
    }

    resultDiv.innerHTML = '<div class="loader"></div>';
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: "GET_PROBLEM_DATA" });
      const hint = await fetchGroqHint(res.text, res.code, type, storage.groqApiKey);
      resultDiv.innerText = hint;
    } catch (err) {
      resultDiv.innerText = "Error: Refresh LeetCode and try again.";
    }
  });

  // 4. Copy Logic
  document.getElementById("copy-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(resultDiv.innerText);
    const btn = document.getElementById("copy-btn");
    btn.innerText = "Copied!";
    setTimeout(() => btn.innerText = "Copy", 1500);
  });
});

async function fetchGroqHint(problem, code, type, apiKey) {
  const isStuck = code && code.trim().length > 50;
  const systemPrompt = `You are a direct LeetCode Assistant. Address the dev as "You". NEVER give full code.`;
  
  let instruction = "";
  if (type === "short") {
    instruction = "Provide a 'Short Hint'. Exactly one short sentence pointing out the immediate logic gap. No fluff.";
  } else if (type === "detailed") {
    instruction = "Provide a deep-dive analysis of the logic and missing edge cases.";
  } else {
    instruction = "Provide 3 technical key points using '-' bullets.";
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `PROBLEM: ${problem}\nCODE: ${isStuck ? code : "None"}\nTASK: ${instruction}` }
      ],
      temperature: 0.1
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}