document.getElementById("hint").addEventListener("click", async () => {
  const resultDiv = document.getElementById("result");
  const Hint_Type = document.getElementById("Hint-type").value;
  
  resultDiv.innerHTML = '<div class="loading"><div class="loader"></div></div>';

  const storage = await chrome.storage.sync.get(["geminiApiKey"]);
  if (!storage.geminiApiKey) {
    resultDiv.innerText = "API key not found. Set it in the extension options.";
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  let res;
  try {
    // This expects the content script to return both { text, code }
    res = await chrome.tabs.sendMessage(tab.id, { type: "GET_PROBLEM_DATA" });
  } catch (error) {
    resultDiv.innerText = "Open LeetCode and refresh the page.";
    return;
  }

  if (!res || !res.text) {
    resultDiv.innerText = "Could not extract data from this page.";
    return;
  }

  try {
    const summary = await getGeminiSummary(
      res.text,
      res.code,
      Hint_Type,
      storage.geminiApiKey
    );
    resultDiv.innerText = summary;
  } catch (error) {
    resultDiv.innerText = error.message;
  }
});

document.getElementById("copy-btn").addEventListener("click", () => {
  const summaryText = document.getElementById("result").innerText;
  if (summaryText?.trim()) {
    navigator.clipboard.writeText(summaryText).then(() => {
      const copyBtn = document.getElementById("copy-btn");
      const originalText = copyBtn.innerText;
      copyBtn.innerText = "Copied!";
      setTimeout(() => (copyBtn.innerText = originalText), 2000);
    });
  }
});

async function getGeminiSummary(problemText, userCode, hintType, apiKey) {
  const truncatedProblem = problemText.length > 15000 ? problemText.substring(0, 15000) + "..." : problemText;
  
  // Logic to check if user has actually written code (excluding default boilerplates)
  const hasCode = userCode && userCode.trim().length > 60; 

  let contextPrompt = "";
  if (!hasCode) {
    contextPrompt = "The user has not written any code yet. Provide a high-level starting strategy to approach this problem. Do not provide code.";
  } else {
    contextPrompt = `The user has written this code:\n\n${userCode}\n\nAnalyze it. Point out the logical flaw or the specific next step they are missing. Do not give the full solution code. Be direct and call out bad logic if you see it.`;
  }

  let formatPrompt = "";
  switch (hintType) {
    case "brief":
      formatPrompt = "Limit the response to 2 sentences.";
      break;
    case "detailed":
      formatPrompt = "Provide a deep-dive explanation of the logic and edge cases.";
      break;
    case "bullets":
      formatPrompt = "Provide 2-3 key insights using only '-' as bullets.";
      break;
    default:
      formatPrompt = "Provide a clear, helpful hint.";
  }

  const finalPrompt = `
    Problem:
    ${truncatedProblem}

    Context:
    ${contextPrompt}

    Constraint:
    ${formatPrompt} 
    Tone: Brutally honest coach. No fluff. No spoilers.
  `;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error?.message || "API request failed");
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No hint available.";
}