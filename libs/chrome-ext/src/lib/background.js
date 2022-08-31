try {
  importScripts('./vendor/rxjs.umd.min.js', './vendor/nuclia-sdk.umd.min.js');
} catch (e) {
  console.error(e);
}

const MENU_LABELSET_PREFIX = `NUCLIA_LABELSET_`;
const SETTINGS = ['NUCLIA_KB', 'NUCLIA_ZONE', 'NUCLIA_KEY', 'YOUTUBE_KEY'];

const baseMenuOptions = {
  targetUrlPatterns: ['https://*/*'],
  contexts: ['link', 'page'],
};

chrome.runtime.onInstalled.addListener(() => {
  createMenu();
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'UPDATE_MENU') {
    createMenu();
  }
  if (request.action === 'UPLOAD_LIST') {
    uploadLinksList(request.selection, request.labels);
  }
});

function createMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: `NUCLIA_UPLOAD`,
      title: 'Upload to Nuclia',
      ...baseMenuOptions,
    });
    chrome.storage.local.get(SETTINGS, (settings) => {
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
  chrome.storage.local.get(SETTINGS, (settings) => {
    if (settings.NUCLIA_KB && settings.NUCLIA_ZONE && settings.NUCLIA_KEY) {
      let labels = [];
      if (info.parentMenuItemId && info.parentMenuItemId.startsWith(MENU_LABELSET_PREFIX)) {
        labels.push({
          labelset: info.parentMenuItemId.split(MENU_LABELSET_PREFIX)[1],
          label: info.menuItemId.split(info.parentMenuItemId + '_')[1],
        });
      }
      if (info.linkUrl) {
        uploadLink(settings, info.linkUrl, labels);
        createMenu(); // Keep menu in sync with actual labelsets
      } else if (info.pageUrl) {
        const url = info.pageUrl;
        if (url.includes('youtube.com/') && settings.YOUTUBE_KEY) {
          if (url.includes('youtube.com/channel/')) {
            const channelId = url.split('/channel/')[1].split('/')[0];
            getChannelVideos(settings, channelId, labels);
          }
          if (url.includes('youtube.com/playlist?list=')) {
            const playlistId = url.split('/playlist?list=')[1].split('&')[0];
            getPlaylistVideos(settings, playlistId, labels);
          }
        } else {
          chrome.runtime.openOptionsPage();
        }
      }
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

function getChannelVideos(settings, channelId, labels) {
  loadPaginated(
    `https://www.googleapis.com/youtube/v3/search?key=${settings.YOUTUBE_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50`,
  )
    .then((items) =>
      items
        .filter((video) => video.id.kind === 'youtube#video')
        .map((video) => ({
          id: video.id.videoId,
          title: video.snippet.title,
          date: video.snippet.publishedAt,
        }))
        .sort((a, b) => b.date.localeCompare(a.date)),
    )
    .then((videos) => selectVideos(videos, labels));
}

function getPlaylistVideos(settings, playlistId, labels) {
  loadPaginated(
    `https://www.googleapis.com/youtube/v3/playlistItems?key=${settings.YOUTUBE_KEY}&playlistId=${playlistId}&part=snippet,id&order=date&maxResults=50`,
  )
    .then((items) =>
      items
        .filter((video) => video.snippet.resourceId.kind === 'youtube#video')
        .map((video) => ({
          id: video.snippet.resourceId.videoId,
          title: video.snippet.title,
          date: video.snippet.publishedAt,
        }))
        .sort((a, b) => b.date.localeCompare(a.date)),
    )
    .then((videos) => selectVideos(videos, labels));
}

function selectVideos(videos, labels) {
  chrome.storage.local.set({ videos });
  chrome.tabs.create({ url: `youtube/selection.html?labels=${JSON.stringify(labels)}` });
}

function uploadLinksList(list, labels) {
  if (!list || !list.length || !list.length > 0)) {
    return;
  }
  chrome.storage.local.get(SETTINGS, (settings) => list.forEach((url) => uploadLink(settings, url, labels)));
}

function getSDK(settings) {
  return new NucliaSDK.Nuclia({
    backend: 'https://nuclia.cloud/api',
    knowledgeBox: settings.NUCLIA_KB,
    zone: settings.NUCLIA_ZONE,
    apiKey: settings.NUCLIA_KEY,
  });
}

function loadPaginated(url, items = [], pageToken = '') {
  return new Promise((resolve, reject) =>
    fetch(pageToken ? `${url}&pageToken=${pageToken}` : url)
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        response
          .json()
          .then((data) => {
            items = items.concat(data.items);

            if (data.nextPageToken) {
              loadPaginated(url, items, data.nextPageToken).then(resolve).catch(reject);
            } else {
              resolve(items);
            }
          })
          .catch(reject);
      })
      .catch(reject),
  );
}
