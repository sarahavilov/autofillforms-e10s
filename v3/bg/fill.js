/* global utils */

const onCommand = () => chrome.tabs.query({
  active: true,
  currentWindow: true
}, tabs => {
  tabs.forEach(async tab => {
    const target = {
      tabId: tab.id,
      allFrames: true
    };
    try {
      await chrome.scripting.executeScript({
        target,
        func: () => self.mode = 'insert'
      });
      await chrome.scripting.executeScript({
        target,
        files: ['/bg/utils.js']
      });
      await chrome.scripting.executeScript({
        target,
        files: ['/bg/defaults.js']
      });
      await chrome.scripting.executeScript({
        target,
        files: ['/bg/regtools.js']
      });
      await chrome.scripting.executeScript({
        target,
        files: ['/data/inject/fill.js']
      });
    }
    catch (e) {
      utils.notify(e.message);
    }
  });
});
chrome.commands.onCommand.addListener(onCommand);
chrome.runtime.onMessage.addListener(request => {
  if (request.cmd === 'fill-forms') {
    onCommand();
  }
});
