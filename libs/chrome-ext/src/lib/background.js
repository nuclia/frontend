try {
  importScripts('./vendor/rxjs.umd.min.js', './vendor/nuclia-sdk.umd.min.js');
} catch (e) {
  console.error(e);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'NucliaContextMenu',
    title: 'Upload to Nuclia',
    targetUrlPatterns: ['https://*/*'],
    contexts: ['link'],
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  chrome.storage.local.get(['NUCLIA_KB', 'NUCLIA_KEY'], ({ NUCLIA_KB, NUCLIA_KEY }) => {
    if (NUCLIA_KB && NUCLIA_KEY) {
      uploadLink(info.linkUrl, NUCLIA_KB, NUCLIA_KEY);
    } else {
      chrome.runtime.openOptionsPage();
    }
  });
});

function uploadLink(url, kb, key) {
  const nuclia = new NucliaSDK.Nuclia({
    backend: 'https://stashify.cloud/api',
    knowledgeBox: kb,
    zone: 'europe-1',
    apiKey: key,
  });
  nuclia.db
    .getKnowledgeBox()
    .pipe(rxjs.switchMap((kb) => kb.createLinkResource({ uri: url })))
    .subscribe();
}
