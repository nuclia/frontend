try {
  importScripts('./api.js', './vendor/rxjs.umd.min.js', './vendor/nuclia-sdk.umd.min.js');
} catch (e) {
  console.error(e);
}

const MENU_LABELSET_PREFIX = `NUCLIA_LABELSET`;
const TITLE_REGEX = /<title>([^<>]+?)<\/title>/;
const IMG_REGEX = /<img[^<>]+?src\=["|'](.+?)["|'][^<>]*?>/gi;

const MENU_TYPES = [
  {
    name: 'PAGE',
    options: {
      contexts: ['page'],
      documentUrlPatterns: ['https://*/*', 'http://*/*'],
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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  getSettings().then((settings) => {
    if (settings.NUCLIA_ACCOUNT && settings.NUCLIA_KB && settings.ZONE && settings.NUCLIA_TOKEN) {
      let labels = [];
      if (info.parentMenuItemId && info.parentMenuItemId.startsWith(MENU_LABELSET_PREFIX)) {
        labels.push({
          labelset: info.parentMenuItemId.split(MENU_LABELSET_PREFIX)[1].split('_')[2],
          label: info.menuItemId.split(info.parentMenuItemId + '_')[1],
        });
      }
      if (tab && tab.id !== chrome.tabs.TAB_ID_NONE) {
        return getCurrentTabContent(tab.id).then((html) => {
          const url = info.pageUrl;
          uploadPage(settings, url, html, labels);
          createMenu(); // Keep menu in sync with actual labelsets each time a page is uploaded
        });
      } else {
        showNotification('Upload Failed', `The page could not be uploaded.`, true);
      }
    } else {
      openOptionsPage();
    }
  });
});

function getCurrentTabContent(tabId) {
  return chrome.scripting
    .executeScript({
      target: { tabId },
      func: () => document.documentElement.outerHTML,
    })
    .then((data) => data[0].result);
}

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

function uploadPage(settings, url, html, labels) {
  replaceImages(html, url)
    .pipe(
      rxjs.switchMap((html) => {
        const matches = html.match(TITLE_REGEX);
        const title = matches ? matches[1] : url;
        return createResource(settings, title, new Blob([html]), labels, 'text/html');
      }),
    )
    .subscribe({
      complete: () => {
        url = url.length > 40 ? `${url.slice(0, 40)}…` : url;
        showNotification('Page uploaded to Nuclia', `${url} has been uploaded`);
      },
      error: () => {
        openOptionsPage();
      },
    });
}

function createResource(settings, title, fileData, labels, mime) {
  return getSDK(settings.NUCLIA_TOKEN, settings.ZONE)
    .db.getKnowledgeBox(settings.NUCLIA_ACCOUNT, settings.NUCLIA_KB, settings.ZONE)
    .pipe(
      rxjs.switchMap((kb) =>
        kb
          .createResource({ title, usermetadata: { classifications: labels } }, true)
          .pipe(rxjs.map((data) => kb.getResourceFromData({ id: data.uuid }))),
      ),
      rxjs.switchMap((resource) =>
        resource.upload('file', fileData, false, {
          contentType: mime,
          filename: title,
        }),
      ),
    );
}

function replaceImages(html, pageUrl) {
  const imageObservables = Array.from(html.matchAll(IMG_REGEX))
    .map(([, url]) => {
      try {
        const baseUrl = new URL(pageUrl).origin;
        const urlObject = new URL(url, baseUrl);
        return urlObject.protocol.startsWith('http') ? [url, urlObject.toString()] : null;
      } catch {
        return null;
      }
    })
    .filter((data) => !!data)
    .map(([url, absoluteUrl]) =>
      rxjs
        .from(
          fetch(absoluteUrl).then((res) => {
            if (!res.ok || !(res.headers.get('Content-Type') || '').startsWith('image')) {
              throw 'error';
            }
            return res.blob();
          }),
        )
        .pipe(
          rxjs.switchMap((blob) => {
            return rxjs.from(
              new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => reject();
                reader.readAsDataURL(blob);
              }),
            );
          }),
          rxjs.map((base64) => [url, base64]),
          rxjs.catchError(() => rxjs.of(null)),
        ),
    );
  return (imageObservables.length > 0 ? rxjs.forkJoin(imageObservables) : of([])).pipe(
    rxjs.map((images) => {
      images
        .filter((image) => !!image)
        .forEach(([url, base64]) => {
          html = html.replaceAll(url, base64);
        });
      return html;
    }),
  );
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
