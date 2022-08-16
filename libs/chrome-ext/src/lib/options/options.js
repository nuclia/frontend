function saveOptions() {
  const kb = document.getElementById('kb').value;
  const key = document.getElementById('key').value;
  chrome.storage.local.set({ kb, key }, () => {
    const message = document.querySelector('.message');
    message.textContent = 'Options saved';
    setTimeout(() => {
      message.textContent = '';
    }, 1500);
  });
}

function restoreOptions() {
  chrome.storage.local.get({ kb: '', key: '' }, ({kb, key}) => {
    document.getElementById('kb').value = kb;
    document.getElementById('key').value = key;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
