/* globals defaults */
'use strict';

chrome.contextMenus.onClicked.addListener((info, tab) => {
  let name = info.menuItemId;
  defaults.utils.getProfile(null, profile => {
    let value = profile[name] || name;
    value = defaults.utils.format(value);

    chrome.tabs.executeScript(tab.id, {
      'runAt': 'document_start',
      'allFrames': true,
      'code': `
        if (context) {
          context.value = '${value}';
          try {
            context.selectionStart = context.selectionEnd = request.value.length;
          } catch (e) {}
          change(context);
          context = null;
        }
      `
    });
  });
});

var build = function (name) {
  chrome.contextMenus.removeAll(() => {
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
};

window.setTimeout(build, 3000);
chrome.storage.onChanged.addListener(prefs => {
  if (prefs.current) {
    build(prefs.current);
  }
  if (Object.keys(prefs).filter(n => n.startsWith('profile-')).length) {
    build();
  }
});

// popup
(function (onCommand) {
  chrome.commands.onCommand.addListener(onCommand);
  chrome.runtime.onMessage.addListener(request => {
    if (request.cmd === 'fill-forms') {
      onCommand();
    }
  });
})(function () {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.executeScript(tab.id, {
        'runAt': 'document_start',
        'allFrames': true,
        'code': `var mode = 'insert'`
      }, () => {
        chrome.tabs.executeScript(tab.id, {
          'runAt': 'document_start',
          'allFrames': true,
          'file': '/lib/defaults.js'
        }, () => {
          chrome.tabs.executeScript(tab.id, {
            'runAt': 'document_start',
            'allFrames': true,
            'file': '/lib/regtools.js'
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
});

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
    }, (tabs) => {
      tabs.forEach(tab => {
        let hostname = (new URL(tab.url)).hostname;
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
              'file': '/lib/defaults.js'
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
    }, (tabs) => {
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
                'file': '/lib/defaults.js'
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
});

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': navigator.userAgent.toLowerCase().indexOf('firefox') === -1 ? true : false
}, prefs => {
  let version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://add0n.com/autofillforms-e10s.html?version=' + version +
          '&type=' + (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
      });
    });
  }
});
(function () {
  let {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
})();
