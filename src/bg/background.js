/* globals defaults */
'use strict';

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const name = info.menuItemId;
  defaults.utils.getProfile(null, profile => {
    let value = profile[name] || name;
    value = defaults.utils.format(value);
    value = value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');

    chrome.tabs.executeScript(tab.id, {
      'frameId': info.frameId,
      'runAt': 'document_start',
      'allFrames': true,
      'code': `{
        const e = document.activeElement;
        if ('value' in e) {
          e.value = '${value}';
          try {
            e.selectionStart = e.selectionEnd = e.value.length;
            e.dispatchEvent(new Event('change'));
          }
          catch (e) {}
        }
      }`
    }, () => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        defaults.utils.notify('Use the options page to allow cross-origin access\n\n' + lastError.message);
      }
    });
  });
});

const build = name => chrome.contextMenus.removeAll(() => {
  defaults.utils.getProfile(name, profile => {
    Object.keys(profile).sort().forEach(title => {
      chrome.contextMenus.create({
        id: title,
        title,
        contexts: ['editable']
      });
    });
  });
});

chrome.runtime.onInstalled.addListener(() => setTimeout(build, 1000));
chrome.runtime.onStartup.addListener(() => setTimeout(build, 1000));
chrome.storage.onChanged.addListener(prefs => {
  if (prefs.current) {
    build(prefs.current);
  }
  if (Object.keys(prefs).filter(n => n.startsWith('profile-')).length) {
    build();
  }
});

// popup
{
  const onCommand = () => {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.executeScript(tab.id, {
          'runAt': 'document_start',
          'allFrames': true,
          'code': `var mode = 'insert'`
        }, () => {
          const lastError = chrome.runtime.lastError;
          if (lastError) {
            return defaults.utils.notify(lastError.message);
          }
          chrome.tabs.executeScript(tab.id, {
            'runAt': 'document_start',
            'allFrames': true,
            'file': '/bg/defaults.js'
          }, () => {
            chrome.tabs.executeScript(tab.id, {
              'runAt': 'document_start',
              'allFrames': true,
              'file': '/bg/regtools.js'
            }, () => {
              chrome.tabs.executeScript(tab.id, {
                'runAt': 'document_start',
                'allFrames': true,
                'file': '/data/inject/fill.js'
              });
            });
          });
        });
      });
    });
  };
  chrome.commands.onCommand.addListener(onCommand);
  chrome.runtime.onMessage.addListener(request => {
    if (request.cmd === 'fill-forms') {
      onCommand();
    }
  });
}

// inject
chrome.runtime.onMessage.addListener((request, sender, response) => {
  // from content script
  if (request.cmd === 'get-url') {
    response(sender.tab.url);
  }
  else if (request.cmd === 'notify') {
    defaults.utils.notify(request.message);
  }
  // from popup
  else if (request.cmd === 'extract-rules') {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      tabs.forEach(tab => {
        const hostname = (new URL(tab.url)).hostname;
        // add rules to this hostname only?
        chrome.tabs.executeScript(tab.id, {
          'runAt': 'document_start',
          'allFrames': false,
          'code': `
            window.confirm('Only add rules for this domain (${hostname})?');
          `
        }, response => {
          // set global variable
          chrome.tabs.executeScript(tab.id, {
            'runAt': 'document_start',
            'allFrames': true,
            'code': `
              var hostname = '${response[0] ? hostname : ''}';
            `
          }, () => {
            // run the actual extractor
            chrome.tabs.executeScript(tab.id, {
              'runAt': 'document_start',
              'allFrames': true,
              'file': '/bg/defaults.js'
            }, () => {
              chrome.tabs.executeScript(tab.id, {
                'runAt': 'document_start',
                'allFrames': true,
                'file': '/data/inject/extract_rules.js'
              });
            });
          });
        });
      });
    });
  }
  else if (request.cmd === 'create-profile') {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      tabs.forEach(tab => {
        // ask for profile name
        chrome.tabs.executeScript(tab.id, {
          'runAt': 'document_start',
          'allFrames': false,
          'code': `
            window.prompt(
              'Select a name for your new profile or use an old name to update existing profile',
              '${request.profile}'
            );
          `
        }, response => {
          // inject response variable to content script
          if (response[0]) {
            chrome.tabs.executeScript(tab.id, {
              'runAt': 'document_start',
              'allFrames': true,
              'code': `
                var current = '${response[0]}';
                var mode = 'retrieve';
              `
            }, () => {
              chrome.tabs.executeScript(tab.id, {
                'runAt': 'document_start',
                'allFrames': true,
                'file': '/bg/defaults.js'
              }, () => {
                chrome.tabs.executeScript(tab.id, {
                  'runAt': 'document_start',
                  'allFrames': true,
                  'file': '/data/inject/fill.js'
                });
              });
            });
          }
        });
      });
    });
  }
  else if (request.cmd === 'update-profile') {
    lazySave.profile.cache.push(request);
    clearTimeout(lazySave.profile.id);
    lazySave.profile.id = window.setTimeout(lazySave.profile.save, 1000);
  }
  else if (request.cmd === 'save-rules') {
    lazySave.rules.cache.push(request);
    clearTimeout(lazySave.rules.id);
    lazySave.rules.id = setTimeout(lazySave.rules.save, 1000);
  }
});

const lazySave = {
  profile: {
    id: null,
    cache: [],
    save() {
      const values = lazySave.profile.cache.map(r => r.values)
        // flatten
        .reduce((a, b) => a.concat(b));

      const profile = values
        .reduce((p, c) => {
          p[c.name] = c.value;
          return p;
        }, lazySave.profile.cache[0].profile);
      const current = lazySave.profile.cache[0].current;
      const users = lazySave.profile.cache[0].users;

      defaults.utils.storeProfile(current, profile, () => {
        defaults.utils.addUser(current, users, () => {
          chrome.storage.local.set({
            current
          }, () => {
            if (values.length) {
              defaults.utils.notify(`${values.length} values is added or updated for "${current}" profile.`);
            }
            lazySave.profile.cache = [];
          });
        });
      });
    }
  },
  rules: {
    id: null,
    cache: [],
    save() {
      let rules = lazySave.rules.cache.map(r => r.rules.new)
        // flatten
        .reduce((a, b) => a.concat(b));
      const length = rules.map(r => r.name).filter((n, i, l) => l.indexOf(n) === i).length;

      rules = rules.reduce((p, c) => {
        p[c.name] = {
          'site-rule': c.site,
          'field-rule': c.field
        };
        return p;
      }, lazySave.rules.cache[0].rules.old);

      chrome.storage.local.set({
        rules: JSON.stringify(rules)
      }, () => {
        defaults.utils.notify(`${length} rules is added or updated in your rule list`);
      });
    }
  }
};

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
