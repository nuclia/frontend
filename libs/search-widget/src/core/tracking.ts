import posthog from 'posthog-js';

let _kbid = '';

export function initTracking(kbid: string) {
  _kbid = kbid;
  if (window.location.hostname !== 'localhost') {
    posthog.init('phc_TAooetKnDVSmvK9WfqtFVUtiEjxpgnPYQ5OaTWUVuY8', { api_host: 'https://eu.posthog.com' });
  }
}

export function logEvent(name: string, params: { [key: string]: string | number } = {}) {
  params['kbid'] = _kbid;
  if (window.location.hostname !== 'localhost') {
    posthog.capture(`[${name}]`, params);
  } else if (localStorage.getItem('DEBUG_TRACKING') === 'on') {
    console.info(`[${name}]`, params);
  }
}
