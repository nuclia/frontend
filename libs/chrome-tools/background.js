try {
  importScripts('./sdk/rxjs-7.5.2.umd.min.js', './sdk/nuclia-sdk.umd.min.js');
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
  chrome.storage.local.get(['kb', 'key'], ({ kb, key }) => {
    if (kb && key) {
      uploadLink(info.linkUrl, kb, key);
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
