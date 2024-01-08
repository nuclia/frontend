let nuclia;

let data = {
  logged: false,
  showWelcome: false,
  accounts: [],
  kbs: {},
  validKb: false,
};

function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('access_token');
  data.showWelcome = urlParams.has('access_token');
  if (token) {
    chrome.storage.local.set({ NUCLIA_TOKEN: token }).then(() => fetchData());
  } else {
    fetchData();
  }
}

function fetchData() {
  rxjs
    .from(getSettings())
    .pipe(
      rxjs.tap((settings) => {
        nuclia = getSDK(settings.NUCLIA_TOKEN);
      }),
      rxjs.switchMap(() =>
        nuclia.db.getWelcome().pipe(
          rxjs.tap(() => {
            data.logged = true;
          }),
          rxjs.catchError((e) => {
            data.logged = false;
            data.showWelcome = false;
            chrome.storage.local.set({ NUCLIA_TOKEN: '' });
            throw e;
          }),
        ),
      ),
      rxjs.switchMap(() => nuclia.db.getAccounts()),
      rxjs.switchMap((accountsData) => {
        data.accounts = accountsData;
        return accountsData.length === 0
          ? rxjs.of([])
          : rxjs.forkJoin(
              accountsData.map((account) =>
                nuclia.db.getKnowledgeBoxes(account.slug, account.id).pipe(rxjs.map((kbs) => [account.slug, kbs])),
              ),
            );
      }),
      rxjs.switchMap((kbsData) => {
        kbsData.forEach(([account, kbs]) => {
          data.kbs[account] = kbs.filter((kb) => ['SOWNER', 'SCONTRIBUTOR'].includes(kb.role_on_kb));
        });
        return rxjs.from(getSettings());
      }),
    )
    .subscribe({
      next: (settings) => {
        const validAccount = data.accounts.some((account) => account.slug === settings.NUCLIA_ACCOUNT);
        data.validKb = validAccount && data.kbs[settings.NUCLIA_ACCOUNT].some((kb) => kb.slug === settings.NUCLIA_KB);
        initUI();
      },
      error: () => initUI(),
    });
}

function initUI() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('error')) {
    document.getElementById('error').classList.remove('hidden');
  }
  if (data.showWelcome && data.validKb) {
    document.getElementById('welcome').classList.remove('hidden');
  } else if (data.logged) {
    setAccountOptions();
    getSettings().then((settings) => {
      document.getElementById('youTubeKey').value = settings.YOUTUBE_KEY;
    });
    document.getElementById('logged').classList.remove('hidden');
  } else {
    document.getElementById('auth').classList.remove('hidden');
  }
}

function setAccountOptions() {
  const accountSelect = document.getElementById('account');
  accountSelect.innerHTML = '<option value="">Select account</option>';
  data.accounts.forEach((account) => {
    const option = document.createElement('option');
    option.setAttribute('value', account.slug);
    option.textContent = account.title;
    accountSelect.append(option);
  });
  accountSelect.addEventListener('change', (event) => {
    setKbOptions(event.target.value);
  });
  getSettings().then((settings) => {
    if (data.validKb) {
      accountSelect.value = settings.NUCLIA_ACCOUNT;
    }
    setKbOptions(accountSelect.value);
  });
}

function setKbOptions(account) {
  const kbSelect = document.getElementById('kb');
  kbSelect.innerHTML = '<option value="">Select knowledge box</option>';
  account ? kbSelect.removeAttribute('disabled') : kbSelect.setAttribute('disabled', '');
  (data.kbs[account] || []).forEach((kb) => {
    const option = document.createElement('option');
    option.setAttribute('value', kb.slug);
    option.textContent = kb.title;
    kbSelect.append(option);
  });
  getSettings().then((settings) => {
    if (data.validKb) {
      kbSelect.value = settings.NUCLIA_KB;
    }
  });
}

function saveForm() {
  const account = document.getElementById('account').value;
  const kb = document.getElementById('kb').value;
  const youTubeKey = document.getElementById('youTubeKey').value;
  chrome.storage.local.set({ NUCLIA_ACCOUNT: account, NUCLIA_KB: kb, YOUTUBE_KEY: youTubeKey }, () => {
    const message = document.querySelector('.submit-message');
    message.textContent = 'Settings saved';
    chrome.runtime.sendMessage({ action: 'UPDATE_MENU' });
    setTimeout(() => {
      message.textContent = '';
    }, 1500);
  });
}

function login() {
  window.location.href = getLoginUrl();
}

function close() {
  chrome.tabs.getCurrent((tab) => chrome.tabs.remove(tab.id, () => {}));
}

document.addEventListener('DOMContentLoaded', init);
document.getElementById('save').addEventListener('click', saveForm);
document.getElementById('login').addEventListener('click', login);
document.getElementById('close').addEventListener('click', close);
