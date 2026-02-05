// content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_PROBLEM_DATA") {
    const data = getLeetCodeData();
    sendResponse(data);
  }
  return true; // Keep channel open for async response
});

function getLeetCodeData() {
  // 1. Get Problem Description
  // LeetCode often nests description in a specific div. We try a few common selectors.
  const descriptionElement = 
    document.querySelector('div[data-track-load="description_content"]') || 
    document.querySelector('.elfjS'); // Fallback class (changes often on LC)

  const problemText = descriptionElement ? descriptionElement.innerText : "Could not find problem description.";

  // 2. Get User Code from Monaco Editor
  // The Monaco editor renders code in lines within view-lines
  const codeLines = document.querySelectorAll('.view-line');
  let userCode = "";
  
  if (codeLines.length > 0) {
    userCode = Array.from(codeLines)
      .map(line => line.innerText.replace(/\u00A0/g, ' ')) // Replace non-breaking spaces
      .join('\n');
  }

  return {
    text: problemText,
    code: userCode
  };
}