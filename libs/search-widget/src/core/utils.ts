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
