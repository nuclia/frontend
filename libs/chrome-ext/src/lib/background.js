try {
  importScripts('./vendor/rxjs.umd.min.js', './vendor/nuclia-sdk.umd.min.js');
} catch (e) {
  console.error(e);
}

const MENU_LABELSET_PREFIX = `NUCLIA_LABELSET_`;
const KB_SETTINGS = ['NUCLIA_KB', 'NUCLIA_ZONE', 'NUCLIA_KEY'];

const baseMenuOptions = {
  targetUrlPatterns: ['https://*/*'],
  contexts: ['link'],
};

chrome.runtime.onInstalled.addListener(() => {
  createMenu();
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'UPDATE_MENU') {
    createMenu();
  }
});

function createMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: `NUCLIA_UPLOAD`,
      title: 'Upload link to Nuclia',
      ...baseMenuOptions,
    });
    chrome.storage.local.get(KB_SETTINGS, (settings) => {
      if (settings.NUCLIA_KB && settings.NUCLIA_ZONE && settings.NUCLIA_KEY) {
        getLabels(settings).subscribe((labelsets) => {
          if (labelsets.length > 0) {
            createSubmenus(labelsets);
          }
        });
      }
    });
  });
}

function createSubmenus(labelsets) {
  chrome.contextMenus.create({
    id: `NUCLIA_UPLOAD_WITH_LABEL`,
    title: 'Upload link to Nuclia with label…',
    ...baseMenuOptions,
  });
  labelsets.forEach(([key, labelset]) => {
    const labelsetMenuId = `${MENU_LABELSET_PREFIX}${key}`;
    chrome.contextMenus.create({
      id: labelsetMenuId,
      title: labelset.title,
      parentId: 'NUCLIA_UPLOAD_WITH_LABEL',
      ...baseMenuOptions,
    });
    labelset.labels.forEach((label) => {
      chrome.contextMenus.create({
        id: `${labelsetMenuId}_${label.title}`,
        title: label.title,
        parentId: labelsetMenuId,
        ...baseMenuOptions,
      });
    });
  });
}

chrome.contextMenus.onClicked.addListener((info) => {
  chrome.storage.local.get(KB_SETTINGS, (settings) => {
    if (settings.NUCLIA_KB && settings.NUCLIA_ZONE && settings.NUCLIA_KEY) {
      let labels = [];
      if (info.parentMenuItemId && info.parentMenuItemId.startsWith(MENU_LABELSET_PREFIX)) {
        labels.push({
          labelset: info.parentMenuItemId.split(MENU_LABELSET_PREFIX)[1],
          label: info.menuItemId.split(info.parentMenuItemId + '_')[1],
        });
      }
      uploadLink(settings, info.linkUrl, labels);
      createMenu(); // Keep menu in sync with actual labelsets
    } else {
      chrome.runtime.openOptionsPage();
    }
  });
});

function getLabels(settings) {
  return getSDK(settings)
    .knowledgeBox.getLabels()
    .pipe(
      rxjs.map((labels) =>
        Object.entries(labels)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .filter(([key, labelset]) => labelset.kind.length === 0 || labelset.kind.includes('RESOURCES'))
          .filter(([key, labelset]) => labelset.labels.length > 0),
      ),
    );
}

function uploadLink(settings, url, labels) {
  getSDK(settings)
    .db.getKnowledgeBox()
    .pipe(rxjs.switchMap((kb) => kb.createLinkResource({ uri: url }, { classifications: labels })))
    .subscribe();
}

function getSDK(settings) {
  return new NucliaSDK.Nuclia({
    backend: 'https://nuclia.cloud/api',
    knowledgeBox: settings.NUCLIA_KB,
    zone: settings.NUCLIA_ZONE,
    apiKey: settings.NUCLIA_KEY,
  });
}
