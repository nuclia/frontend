chrome.storage.local.get(['videos'], (results) => {
  document.getElementById('count').innerText = results.videos.length;
  const container = document.getElementById('list');
  const template = document.querySelector('#row');
  results.videos.forEach((video) => {
    const clone = document.importNode(template.content, true);
    const cells = clone.querySelectorAll('span');
    cells[0].textContent = video.title;
    cells[1].textContent = video.date.slice(0, 10);
    const input = clone.querySelector('input');
    input.value = video.id;

    container.appendChild(clone);
  });
});

const labels = JSON.parse(new URLSearchParams(location.search.slice(1)).get('labels'));

const uploadVideos = () => {
  const selection = [...document.querySelectorAll('input[type="checkbox"]')]
    .filter((node) => node.checked)
    .map((node) => `https://www.youtube.com/watch?v=${node.value}`);
  chrome.runtime.sendMessage({ action: 'UPLOAD_LIST', selection, labels });
  const button = document.getElementById('upload-button');
  button.innerText = 'Done!';
  button.setAttribute('disabled', 'true');
};

const close = () => {
  chrome.storage.local.set({ videos: [] });
  chrome.tabs.getCurrent((tab) => chrome.tabs.remove(tab.id, () => {}));
};

document.getElementById('upload-button').addEventListener('click', uploadVideos);
document.getElementById('close-button').addEventListener('click', close);
