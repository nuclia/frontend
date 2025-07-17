try {
  importScripts('./api.js', './vendor/rxjs.umd.min.js', './vendor/nuclia-sdk.umd.min.js');
} catch (e) {
  console.error(e);
}

const MENU_LABELSET_PREFIX = `NUCLIA_LABELSET`;

const MENU_TYPES = [
  {
    name: 'LINK',
    options: {
      targetUrlPatterns: ['https://*/*'],
      contexts: ['link'],
    },
  },
];

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
    MENU_TYPES.forEach((type) => {
      chrome.contextMenus.create({
        id: `${type.name}_NUCLIA_UPLOAD`,
        title: 'Upload to Nuclia',
        ...type.options,
      });
    });
    getSettings().then((settings) => {
      if (settings.NUCLIA_ACCOUNT && settings.NUCLIA_KB && settings.ZONE && settings.NUCLIA_TOKEN) {
        getLabels(settings).subscribe((labelsets) => {
          if (labelsets.length > 0) {
            MENU_TYPES.forEach((type) => {
              createSubmenus(labelsets, type);
            });
          }
        });
      }
    });
  });
}

function createSubmenus(labelsets, type) {
  chrome.contextMenus.create({
    id: `${type.name}_NUCLIA_UPLOAD_WITH_LABEL`,
    title: 'Upload to Nuclia with label…',
    ...type.options,
  });
  labelsets.forEach(([key, labelset]) => {
    const labelsetMenuId = `${MENU_LABELSET_PREFIX}_${type.name}_${key}`;
    chrome.contextMenus.create({
      id: labelsetMenuId,
      title: labelset.title,
      parentId: `${type.name}_NUCLIA_UPLOAD_WITH_LABEL`,
      ...type.options,
    });
    labelset.labels.forEach((label) => {
      chrome.contextMenus.create({
        id: `${labelsetMenuId}_${label.title}`,
        title: label.title,
        parentId: labelsetMenuId,
        ...type.options,
      });
    });
  });
}

chrome.contextMenus.onClicked.addListener((info) => {
  getSettings().then((settings) => {
    if (settings.NUCLIA_ACCOUNT && settings.NUCLIA_KB && settings.ZONE && settings.NUCLIA_TOKEN) {
      let labels = [];
      if (info.parentMenuItemId && info.parentMenuItemId.startsWith(MENU_LABELSET_PREFIX)) {
        labels.push({
          labelset: info.parentMenuItemId.split(MENU_LABELSET_PREFIX)[1].split('_')[2],
          label: info.menuItemId.split(info.parentMenuItemId + '_')[1],
        });
      }
      if (info.linkUrl) {
        const url = info.linkUrl;
        uploadSingleLink(settings, url, labels);
        createMenu(); // Keep menu in sync with actual labelsets each time a link is uploaded
      }
    } else {
      openOptionsPage();
    }
  });
});

function getLabels(settings) {
  return getSDK(settings.NUCLIA_TOKEN, settings.ZONE)
    .db.getKnowledgeBox(settings.NUCLIA_ACCOUNT, settings.NUCLIA_KB, settings.ZONE)
    .pipe(
      rxjs.switchMap((kb) => kb.getLabels()),
      rxjs.map((labels) =>
        Object.entries(labels)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .filter(([key, labelset]) => labelset.kind.length === 0 || labelset.kind.includes('RESOURCES'))
          .filter(([key, labelset]) => labelset.labels.length > 0),
      ),
    );
}

function uploadSingleLink(settings, url, labels) {
  uploadLink(settings, url, labels).subscribe({
    complete: () => {
      url = url.length > 40 ? `${url.slice(0, 40)}…` : url;
      showNotification('Link uploaded to Nuclia', `${url} has been uploaded`);
    },
    error: () => openOptionsPage(),
  });
}

function uploadLink(settings, url, labels) {
  return getSDK(settings.NUCLIA_TOKEN, settings.ZONE)
    .db.getKnowledgeBox(settings.NUCLIA_ACCOUNT, settings.NUCLIA_KB, settings.ZONE)
    .pipe(rxjs.switchMap((kb) => kb.createLinkResource({ uri: url }, { classifications: labels })));
}

function openOptionsPage() {
  chrome.tabs.create({ url: 'options/options.html?error=true' });
}

function showNotification(title, message, error = false) {
  chrome.notifications.create({
    type: 'basic',
    title: title,
    message: message,
    iconUrl: error ? 'icons/error.png' : 'icons/icon128.png',
    priority: 2,
  });
}
