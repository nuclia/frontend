
// Thanks to https://stackoverflow.com/a/30795206
const REGEX_YOUTUBE_URL = /^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/)/;
const REGEX_YOUTUBE_VIDEO_URL = /(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/)([a-zA-Z0-9\_-]+)/;

const isYoutubeUrl = (url) => {
  return REGEX_YOUTUBE_URL.test(url);
}

const isYoutubeVideoUrl = (url) => {
  return isYoutubeUrl(url) && REGEX_YOUTUBE_VIDEO_URL.test(url);
}

const isYoutubeChannelUrl = (url) => {
  return isYoutubeUrl(url) && url.includes('/channel/');
}

const getChannelId = (url) => {
  return url.split('/channel/')[1].split('/')[0];
}

const isYoutubePlaylistUrl = (url) => {
  return isYoutubeUrl(url) && url.includes('/playlist?list=');
}

const getPlaylistId = (url) => {
  return url.split('/playlist?list=')[1].split('&')[0];
}
