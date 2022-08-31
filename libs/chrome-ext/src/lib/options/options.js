const DEFAULT_ZONE = 'europe-1';

function saveOptions() {
  const kb = document.getElementById('kb').value;
  const zone = document.getElementById('zone').value;
  const key = document.getElementById('key').value;
  const youTubeKey = document.getElementById('youTubeKey').value;
  chrome.storage.local.set({ NUCLIA_KB: kb, NUCLIA_ZONE: zone, NUCLIA_KEY: key, YOUTUBE_KEY: youTubeKey }, () => {
    const message = document.querySelector('.message');
    message.textContent = 'Options saved';
    chrome.runtime.sendMessage({ action: 'UPDATE_MENU' });
    setTimeout(() => {
      message.textContent = '';
    }, 1500);
  });
}

function restoreOptions() {
  chrome.storage.local.get(
    { NUCLIA_KB: '', NUCLIA_ZONE: DEFAULT_ZONE, NUCLIA_KEY: '', YOUTUBE_KEY: '' },
    ({ NUCLIA_KB, NUCLIA_ZONE, NUCLIA_KEY, YOUTUBE_KEY }) => {
      document.getElementById('kb').value = NUCLIA_KB;
      document.getElementById('zone').value = NUCLIA_ZONE;
      document.getElementById('key').value = NUCLIA_KEY;
      document.getElementById('youTubeKey').value = YOUTUBE_KEY;
    },
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
