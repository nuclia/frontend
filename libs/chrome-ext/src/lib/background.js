try {
  importScripts('./utils.js', './api.js', './vendor/rxjs.umd.min.js', './vendor/nuclia-sdk.umd.min.js');
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
  {
    name: 'YOUTUBE',
    options: {
      documentUrlPatterns: [
        'https://www.youtube.com/channel/*',
        'https://www.youtube.com/c/*',
        'https://www.youtube.com/user/*',
        'https://www.youtube.com/playlist?list=*',
      ],
      contexts: ['page'],
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
  if (request.action === 'UPLOAD_LIST') {
    uploadLinksList(request.selection, request.labels);
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
      if (settings.NUCLIA_ACCOUNT && settings.NUCLIA_KB && settings.NUCLIA_TOKEN) {
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
    if (settings.NUCLIA_ACCOUNT && settings.NUCLIA_KB && settings.NUCLIA_TOKEN) {
      let labels = [];
      if (info.parentMenuItemId && info.parentMenuItemId.startsWith(MENU_LABELSET_PREFIX)) {
        labels.push({
          labelset: info.parentMenuItemId.split(MENU_LABELSET_PREFIX)[1].split('_')[2],
          label: info.menuItemId.split(info.parentMenuItemId + '_')[1],
        });
      }
      if (info.linkUrl) {
        const url = info.linkUrl;
        if (isYoutubeUrl(url)) {
          if (isYoutubeVideoUrl(url)) {
            uploadSingleLink(settings, url, labels);
          } else if (isYoutubeChannelUrl(url)) {
            settings.YOUTUBE_KEY ? getChannelVideos(settings, url, labels) : openOptionsPage();
          } else if (isYoutubePlaylistUrl(url)) {
            settings.YOUTUBE_KEY ? getPlaylistVideos(settings, getPlaylistId(url), labels) : openOptionsPage();
          } else {
            showNotification('Link cannot be uploaded', 'The selected YouTube URL is not supported by Nuclia', true);
          }
        } else {
          uploadSingleLink(settings, url, labels);
        }
        createMenu(); // Keep menu in sync with actual labelsets each time a link is uploaded
      } else if (info.pageUrl) {
        const url = info.pageUrl;
        if (isYoutubeUrl(url) && settings.YOUTUBE_KEY) {
          if (isYoutubeChannelUrl(url)) {
            getChannelVideos(settings, url, labels);
          } else if (isYoutubePlaylistUrl(url)) {
            getPlaylistVideos(settings, getPlaylistId(url), labels);
          }
        } else {
          openOptionsPage();
        }
      }
    } else {
      openOptionsPage();
    }
  });
});

function getLabels(settings) {
  return getSDK(settings.NUCLIA_TOKEN)
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
  return getSDK(settings.NUCLIA_TOKEN)
    .db.getKnowledgeBox(settings.NUCLIA_ACCOUNT, settings.NUCLIA_KB, settings.ZONE)
    .pipe(rxjs.switchMap((kb) => kb.createLinkResource({ uri: url }, { classifications: labels })));
}

function getChannelVideos(settings, channelUrl, labels) {
  getYoutubeChannelId(settings.YOUTUBE_KEY, channelUrl)
    .then((channelId) =>
      loadPaginated(
        `https://www.googleapis.com/youtube/v3/search?key=${settings.YOUTUBE_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50`,
      ),
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
    .then((videos) => selectVideos(videos, labels))
    .catch(() => openOptionsPage());
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
    .then((videos) => selectVideos(videos, labels))
    .catch(() => openOptionsPage());
}

function selectVideos(videos, labels) {
  chrome.storage.local.set({ videos });
  chrome.tabs.create({ url: `youtube/selection.html?labels=${JSON.stringify(labels)}` });
}

function uploadLinksList(list, labels) {
  if (!list || !list.length || !list.length > 0) {
    return;
  }
  getSettings().then((settings) => list.forEach((url) => uploadLink(settings, url, labels).subscribe()));
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
