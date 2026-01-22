chrome.runtime.onInstalled.addListener(() => {
   chrome.storage.sync.get(["geminiApiKey"], () => {
    if(!result.geminiApikey) {
        chrome.tabs.create({url: "options.html"});
    }
   }) 
})