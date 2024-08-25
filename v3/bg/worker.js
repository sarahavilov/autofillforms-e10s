/* global utils */

// https://www.w3schools.com/html/html_forms.asp
// https://www.roboform.com/filling-test-all-fields
// https://www.quackit.com/html/codes/html_form_code.cfm
// https://www.quackit.com/html/html_editors/scratchpad/preview.cfm?example=/html/codes/html_form_code_with_bootstrap_grid_system
// https://www.cognitoforms.com/FodMobiliteit1/AIRPORTMEDIATIONNL

if (typeof importScripts !== 'undefined') {
  self.importScripts('defaults.js', 'utils.js');

  self.importScripts('context.js');
  self.importScripts('fill.js');
}

// inject
chrome.runtime.onMessage.addListener((request, sender, response) => {
  // from content script
  if (request.cmd === 'get-url') {
    response(sender.tab.url);
  }
  else if (request.cmd === 'notify') {
    utils.notify(request.message);

    return false;
  }
  // from popup
  else if (request.cmd === 'extract-rules') {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, tabs => {
      tabs.forEach(async tab => {
        try {
          const hostname = (new URL(tab.url)).hostname;
          const target = {
            tabId: tab.id
          };
          // add rules to this hostname only?
          const [response] = await chrome.scripting.executeScript({
            target,
            injectImmediately: true,
            func: hostname => confirm(`Only add rules for this hostname (${hostname})?`),
            args: [hostname]
          });
          // set global variable
          await chrome.scripting.executeScript({
            target: {
              ...target,
              allFrames: true
            },
            injectImmediately: true,
            func: h => self.hostname = h,
            args: [response.result ? hostname : '']
          });
          // run the actual extractor
          await chrome.scripting.executeScript({
            target: {
              ...target,
              allFrames: true
            },
            injectImmediately: true,
            files: ['/bg/defaults.js']
          });
          await chrome.scripting.executeScript({
            target: {
              ...target,
              allFrames: true
            },
            injectImmediately: true,
            files: ['/bg/utils.js']
          });
          await chrome.scripting.executeScript({
            target: {
              ...target,
              allFrames: true
            },
            injectImmediately: true,
            files: ['/data/inject/extract_rules.js']
          });
        }
        catch (e) {
          console.warn(e);
          utils.notify(e.message);
        }
      });
    });
    return false;
  }
  else if (request.cmd === 'create-profile') {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, tabs => {
      tabs.forEach(async tab => {
        try {
          // ask for profile name
          const [response] = await chrome.scripting.executeScript({
            target: {
              tabId: tab.id
            },
            injectImmediately: true,
            func: profile => prompt('Select a name for your new profile or use an old name to update existing profile', profile),
            args: [request.profile]
          });
          const profile = response.result;
          if (profile) {
            const target = {
              tabId: tab.id,
              allFrames: true
            };
            // inject response variable to content script
            await chrome.scripting.executeScript({
              target,
              injectImmediately: true,
              func: profile => {
                self.current = profile;
                self.mode = 'retrieve';
              },
              args: [profile]
            });
            await chrome.scripting.executeScript({
              target,
              injectImmediately: true,
              files: ['/bg/defaults.js']
            });
            await chrome.scripting.executeScript({
              target,
              injectImmediately: true,
              files: ['/bg/utils.js']
            });
            await chrome.scripting.executeScript({
              target,
              injectImmediately: true,
              files: ['/data/inject/fill.js']
            });
          }
        }
        catch (e) {
          utils.notify(e.message);
        }
      });
    });
  }
  else if (request.cmd === 'update-profile') {
    lazySave.profile.cache.push(request);
    clearTimeout(lazySave.profile.id);
    lazySave.profile.id = setTimeout(lazySave.profile.save, 500);
  }
  else if (request.cmd === 'save-rules') {
    lazySave.rules.cache.push(request);
    clearTimeout(lazySave.rules.id);
    lazySave.rules.id = setTimeout(lazySave.rules.save, 500);
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

      utils.storeProfile(current, profile, () => {
        utils.addUser(current, users, () => {
          chrome.storage.local.set({
            current
          }, () => {
            if (values.length) {
              utils.notify(`${values.length} values is added or updated for "${current}" profile.`);
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
        utils.notify(`${length} rules is added or updated in your rule list`);
      });
    }
  }
};

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const {homepage_url: page, name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
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
