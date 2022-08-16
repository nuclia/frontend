function saveOptions() {
  const kb = document.getElementById('kb').value;
  const key = document.getElementById('key').value;
  chrome.storage.local.set({ 'NUCLIA_KB': kb, 'NUCLIA_KEY': key }, () => {
    const message = document.querySelector('.message');
    message.textContent = 'Options saved';
    setTimeout(() => {
      message.textContent = '';
    }, 1500);
  });
}

function restoreOptions() {
  chrome.storage.local.get({ 'NUCLIA_KB': '', 'NUCLIA_KEY': '' }, ({ NUCLIA_KB, NUCLIA_KEY }) => {
    document.getElementById('kb').value = NUCLIA_KB;
    document.getElementById('key').value = NUCLIA_KEY;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
