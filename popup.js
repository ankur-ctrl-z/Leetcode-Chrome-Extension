document.getElementById("hint").addEventListener("click", async () => {
  const resultDiv = document.getElementById("result");
  const type = document.getElementById("Hint-type").value;
  resultDiv.innerHTML = '<div class="loader"></div>';

  const storage = await chrome.storage.sync.get(["groqApiKey"]);
  if (!storage.groqApiKey) {
    resultDiv.innerText = "Error: API Key missing. Go to Options.";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "GET_PROBLEM_DATA" });
    if (!res || !res.text) throw new Error("Could not read LeetCode data.");

    const hint = await fetchGroqHint(res.text, res.code, type, storage.groqApiKey);
    resultDiv.innerText = hint;
  } catch (err) {
    resultDiv.innerText = err.message;
  }
});

async function fetchGroqHint(problem, code, type, apiKey) {
  const isStuck = code && code.trim().length > 50;
  
  const systemPrompt = "You are a brutally honest LeetCode coach. Your goal is to make the user better, not make them feel good. Never give full code solutions. Challenge their logic and call out flaws directly.";
  
  const userPrompt = `
    PROBLEM: ${problem}
    USER_CODE: ${isStuck ? code : "None (User hasn't started)"}
    HINT_TYPE: ${type}
    
    INSTRUCTION: ${isStuck 
      ? "Find the flaw in their code and give a hint for the next step." 
      : "Give a high-level logical strategy to start."} 
    Do not provide the full solution. Keep it straightforward.
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
      temperature: 0.2
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Groq API Failed");
  return data.choices[0].message.content;
}

document.getElementById("copy-btn").addEventListener("click", () => {
  navigator.clipboard.writeText(document.getElementById("result").innerText);
  const btn = document.getElementById("copy-btn");
  btn.innerText = "Saved!";
  setTimeout(() => btn.innerText = "Copy", 2000);
});