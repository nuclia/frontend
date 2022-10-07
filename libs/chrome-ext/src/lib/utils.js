// Thanks to https://stackoverflow.com/a/30795206
const REGEX_YOUTUBE_URL = /^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/)/;
const REGEX_YOUTUBE_VIDEO_URL = /(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/)([a-zA-Z0-9\_-]+)/;
const REGEX_YOUTUBE_ITEMPROP_URL = /<link[\s]+itemprop="url"[\s]+href="([^"]+)"[\s]*>/;

const isYoutubeUrl = (url) => {
  return REGEX_YOUTUBE_URL.test(url);
};

const isYoutubeVideoUrl = (url) => {
  return isYoutubeUrl(url) && REGEX_YOUTUBE_VIDEO_URL.test(url);
};

const isYoutubeChannelUrl = (url) => {
  return (
    isYoutubeUrl(url) &&
    (isYoutubeCanonicalChannelUrl(url) || isYoutubeCustomChannelUrl(url) || isYoutubeLegacyChannelUrl(url))
  );
};

const isYoutubeCanonicalChannelUrl = (url) => {
  return url.includes('/channel/');
};

const isYoutubeCustomChannelUrl = (url) => {
  return url.includes('/c/');
};

const isYoutubeLegacyChannelUrl = (url) => {
  return url.includes('/user/');
};

const getYoutubeChannelId = (key, url) => {
  return new Promise((resolve, reject) => {
    if (isYoutubeCanonicalChannelUrl(url)) {
      resolve(url.split('/channel/')[1].split('/')[0]);
    } else if (isYoutubeLegacyChannelUrl(url)) {
      const user = url.split('/user/')[1].split('/')[0];
      getChannelIdByUser(key, user)
        .then((channelId) => resolve(channelId))
        .catch(reject);
    } else if (isYoutubeCustomChannelUrl(url)) {
      getChannelIdByCustomUrl(url)
        .then((channelId) => resolve(channelId))
        .catch(reject);
    }
  });
};

const getChannelIdByUser = (key, user) => {
  return fetch(`https://youtube.googleapis.com/youtube/v3/channels?part=id&key=${key}&forUsername=${user}`)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then((response) => {
      const channelId = response.items[0].id;
      if (!channelId) {
        throw new Error('User not found');
      }
      return channelId;
    });
};

const getChannelIdByCustomUrl = (url) => {
  return fetch(url)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.text();
    })
    .then((response) => {
      const match = response.match(REGEX_YOUTUBE_ITEMPROP_URL);
      const canonicalUrl = match && match[1];
      const channelId =
        canonicalUrl && isYoutubeCanonicalChannelUrl(canonicalUrl) && canonicalUrl.split('/channel/')[1].split('/')[0];
      if (!channelId) {
        throw new Error('Channel id not found');
      }
      return channelId;
    });
};

const isYoutubePlaylistUrl = (url) => {
  return isYoutubeUrl(url) && url.includes('/playlist?list=');
};

const getPlaylistId = (url) => {
  return url.split('/playlist?list=')[1].split('&')[0];
};
