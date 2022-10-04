

const isYoutubeUrl = (url) => {
  return /^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/)/.test(url);
}

const isYoutubeVideoUrl = (url) => {
  // Thanks to https://stackoverflow.com/a/30795206
  return isYoutubeUrl(url) && /(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/)([a-zA-Z0-9\_-]+)/.test(url);
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
