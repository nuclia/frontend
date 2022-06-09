let CDN = 'https://cdn.nuclia.cloud/';
export const setCDN = (cdn: string) => (CDN = cdn);
export const getCDN = () => CDN;

export const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString();
};

export const formatTime = (secons: number) => {
  secons = Math.floor(secons);
  const minutes = Math.floor(secons/60);
  const seconds = secons % 60;
  const minutesLabel = minutes < 10 ? '0' + minutes : minutes.toString();
  const secondsLabel = seconds < 10 ? '0' + seconds : seconds.toString();
  return `${minutesLabel}.${secondsLabel}`
}

export const formatQueryKey = (key: string): string => {
  return `__nuclia_${key}__`;
}

export const updateQueryParams = (urlParams: URLSearchParams) => {
  const params = urlParams.toString();
  const url = params ? `${location.pathname}?${params}` : location.pathname;
  history.pushState(null, '', url);
}

/**
 * Coerces a value (usually a string coming from a prop) to a boolean.
 * Credit to Angular: https://github.com/angular/components/blob/2f9a59a24c0464cbed7f54cbeb5cba73e6007715/src/cdk/coercion/boolean-property.ts
 * @param value
 */
export const coerceBooleanProperty = (value: any): boolean => {
  return value != null && `${value}` !== 'false';
}

export const getYoutubeId = (url: string) => {
  // From https://stackoverflow.com/a/9102270
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  } else {
    return '';
  }
};

export const isYoutubeUrl = (url: string) => {
  return !!getYoutubeId(url);
};