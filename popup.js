document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("theme-toggle");
  const resultDiv = document.getElementById("result");
  
  const storage = await chrome.storage.sync.get(["theme", "groqApiKey"]);
  
  // Set initial theme
  if (storage.theme === "dark") {
    document.body.setAttribute("data-theme", "dark");
    toggle.checked = true;
  }

  // Toggle listener
  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      document.body.setAttribute("data-theme", "dark");
      chrome.storage.sync.set({ theme: "dark" });
    } else {
      document.body.removeAttribute("data-theme");
      chrome.storage.sync.set({ theme: "light" });
    }
  });

  document.getElementById("hint").addEventListener("click", async () => {
    const type = document.getElementById("Hint-type").value;
    if (!storage.groqApiKey) {
      resultDiv.innerText = "Set API Key in Options first.";
      return;
    }

    resultDiv.innerHTML = '<div class="loader"></div>';
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: "GET_PROBLEM_DATA" });
      const hint = await fetchGroqHint(res.text, res.code, type, storage.groqApiKey);
      resultDiv.innerText = hint;
    } catch (err) {
      resultDiv.innerText = "Error: Refresh LeetCode page.";
    }
  });

  document.getElementById("copy-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(resultDiv.innerText);
    const btn = document.getElementById("copy-btn");
    btn.innerText = "Copied!";
    setTimeout(() => btn.innerText = "Copy", 1500);
  });
});

async function fetchGroqHint(problem, code, type, apiKey) {
  const isStuck = code && code.trim().length > 50;
  const systemPrompt = `You are a direct LeetCode Assistant. Address the dev as "You". NEVER give full code solutions.`;
  
  let instruction = (type === "short") 
    ? "One short sentence pointing out the immediate logic gap. No fluff." 
    : (type === "detailed") 
    ? "Detailed analysis of logic and edge cases." 
    : "3 key points using '-' bullets.";

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