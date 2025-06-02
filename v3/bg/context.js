/* global utils */

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const name = info.menuItemId;
  utils.getProfile(null, profile => {
    let value = profile[name] || name;
    value = utils.format(value);
    value = value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');

    chrome.scripting.executeScript({
      target: {
        tabId: tab.id,
        frameIds: [info.frameId]
      },
      func: value => {
        const e = document.activeElement;
        if ('value' in e) {
          e.value = value;
          try {
            e.selectionStart = e.selectionEnd = e.value.length;
            e.dispatchEvent(new Event('change'));
          }
          catch (e) {}
        }
      },
      args: [value]
    }, () => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        utils.notify('Use the options page to allow cross-origin access\n\n' + lastError.message);
      }
    });
  });
});

const build = name => chrome.contextMenus.removeAll(() => {
  utils.getProfile(name, profile => {
    Object.keys(profile).sort().forEach(title => {
      chrome.contextMenus.create({
        id: title,
        title,
        contexts: ['editable']
      }, () => chrome.runtime.lastError);
    });
  });
});

chrome.runtime.onInstalled.addListener(() => setTimeout(build, 500));
chrome.runtime.onStartup.addListener(() => setTimeout(build, 500));
chrome.storage.onChanged.addListener(prefs => {
  if (prefs.current) {
    build(prefs.current.newValue);
  }
  if (Object.keys(prefs).filter(n => n.startsWith('profile-')).length) {
    build();
  }
});
