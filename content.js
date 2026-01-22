function getQuestionText() {
  // LeetCode specific container
  const desc = document.querySelector('[data-track-load="description_content"]');
  if (desc) return desc.innerText;

  // fallback
  const article = document.querySelector("article");
  if (article) return article.innerText;

  const paragraphs = Array.from(document.querySelectorAll("p"));
  return paragraphs.map(p => p.innerText).join("\n");
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.type === "GET_ARTICLE_TEXT") {
    sendResponse({ text: getQuestionText() });
  }
});
