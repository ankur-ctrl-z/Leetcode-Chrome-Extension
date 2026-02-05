chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_PROBLEM_DATA") {
    const description = document.querySelector('div[data-track-load="description_content"]')?.innerText 
                        || document.querySelector('.elfjS')?.innerText 
                        || "Description not found";

    const codeLines = document.querySelectorAll('.view-line');
    const userCode = Array.from(codeLines)
      .map(line => line.innerText)
      .join('\n');

    sendResponse({ text: description, code: userCode });
  }
  return true;
});