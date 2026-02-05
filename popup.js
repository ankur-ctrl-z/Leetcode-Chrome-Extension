document.addEventListener("DOMContentLoaded", async () => {
  // 1. Load Theme Preference
  const storage = await chrome.storage.sync.get(["theme", "groqApiKey"]);
  if (storage.theme === "dark") {
    document.body.setAttribute("data-theme", "dark");
  }

  // 2. Theme Toggle Logic
  document.getElementById("theme-btn").addEventListener("click", () => {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.body.removeAttribute("data-theme");
      chrome.storage.sync.set({ theme: "light" });
    } else {
      document.body.setAttribute("data-theme", "dark");
      chrome.storage.sync.set({ theme: "dark" });
    }
  });

  // 3. Hint Button Logic
  document.getElementById("hint").addEventListener("click", async () => {
    const resultDiv = document.getElementById("result");
    const type = document.getElementById("Hint-type").value;
    
    if (!storage.groqApiKey) {
      resultDiv.innerText = "Error: API Key missing. Please go to Extension Options to set it up.";
      return;
    }

    resultDiv.innerHTML = '<div class="loader"></div>';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: "GET_PROBLEM_DATA" });
      if (!res || !res.text) throw new Error("Could not read LeetCode data. Refresh the page.");

      const hint = await fetchGroqHint(res.text, res.code, type, storage.groqApiKey);
      resultDiv.innerText = hint;
    } catch (err) {
      resultDiv.innerText = err.message;
    }
  });

  // 4. Copy Button Logic
  document.getElementById("copy-btn").addEventListener("click", () => {
    const text = document.getElementById("result").innerText;
    if (text && !text.includes("Choose hint type")) {
      navigator.clipboard.writeText(text);
      const btn = document.getElementById("copy-btn");
      const original = btn.innerText;
      btn.innerText = "Saved!";
      setTimeout(() => btn.innerText = original, 2000);
    }
  });
});

async function fetchGroqHint(problem, code, type, apiKey) {
  const isStuck = code && code.trim().length > 50;
  
  // UPDATED PROMPT: Direct "You" language, no "User" references.
  const systemPrompt = `
    You are a logical and helpful LeetCode Assistant. 
    Your goal is to guide the developer. 
    ALWAYS address them directly as "You" (e.g., "You forgot to initialize...", "Your loop condition is wrong").
    NEVER refer to them as "User" or in the third person.
    Do not give the full solution code.
  `;
  
  const userPrompt = `
    PROBLEM: ${problem}
    CURRENT CODE: ${isStuck ? code : "None (Just started)"}
    HINT TYPE: ${type}
    
    INSTRUCTION: ${isStuck 
      ? "Analyze the code. Tell me exactly what I have done wrong or what logic I am missing. Be direct." 
      : "Give me a high-level logical strategy to start solving this."}
  `;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Groq API Failed");
  return data.choices[0].message.content;
}