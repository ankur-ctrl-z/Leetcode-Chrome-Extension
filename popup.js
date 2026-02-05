document.addEventListener("DOMContentLoaded", async () => {
  const storage = await chrome.storage.sync.get(["theme", "groqApiKey"]);
  if (storage.theme === "dark") document.body.setAttribute("data-theme", "dark");

  document.getElementById("theme-btn").addEventListener("click", () => {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    const newTheme = isDark ? "light" : "dark";
    if (isDark) document.body.removeAttribute("data-theme");
    else document.body.setAttribute("data-theme", "dark");
    chrome.storage.sync.set({ theme: newTheme });
  });

  document.getElementById("hint").addEventListener("click", async () => {
    const resultDiv = document.getElementById("result");
    const type = document.getElementById("Hint-type").value;
    
    if (!storage.groqApiKey) {
      resultDiv.innerText = "Error: API Key missing in Options.";
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

  document.getElementById("copy-btn").addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById("result").innerText);
    const btn = document.getElementById("copy-btn");
    btn.innerText = "Saved!";
    setTimeout(() => btn.innerText = "Copy", 2000);
  });
});

async function fetchGroqHint(problem, code, type, apiKey) {
  const isStuck = code && code.trim().length > 50;
  const systemPrompt = `You are a direct LeetCode Assistant. Address the dev as "You". NEVER give full code.`;
  
  let instruction = "";
  if (type === "short") {
    instruction = "Provide a 'Short Hint'. This must be EXACTLY one short sentence. Identify the single biggest logic error or the very next step. No extra words.";
  } else if (type === "detailed") {
    instruction = "Provide a detailed analysis of the logic, complexity, and missing edge cases.";
  } else {
    instruction = "Give 2-3 technical key points using '-' bullets.";
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