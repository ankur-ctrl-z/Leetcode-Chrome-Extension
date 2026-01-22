document.getElementById("hint").addEventListener("click", async () => {
  const resultDiv = document.getElementById("result");
  resultDiv.innerText = "Loading...";

  const hintType = document.getElementById("hint-type").value;

  chrome.storage.sync.get(["geminiApiKey"], (result) => {
    if (!result.geminiApiKey) {
      resultDiv.innerText = "API key missing. Set it in options.";
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return;

      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "GET_ARTICLE_TEXT" },
        async (res) => {
          if (!res || !res.text) {
            resultDiv.innerText = "Unable to read problem.";
            return;
          }

          try {
            const hint = await getGeminiHint(
              res.text,
              hintType,
              result.geminiApiKey
            );
            resultDiv.innerText = hint;
          } catch (err) {
            resultDiv.innerText = err.message;
          }
        }
      );
    });
  });
});

document.getElementById("copy-btn").addEventListener("click", () => {
  const text = document.getElementById("result").innerText;
  if (text.trim()) navigator.clipboard.writeText(text);
});

async function getGeminiHint(text, type, apiKey) {
  const truncated = text.slice(0, 20000);

  let prompt = {
    brief: "Give a brief hint (2–3 sentences).",
    detailed: "Give a detailed hint without solution.",
    bullets: "Give 2–3 bullet point hints."
  }[type];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}\n\n${truncated}` }] }],
        generationConfig: { temperature: 0.2 }
      })
    }
  );

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No hint generated.";
}
