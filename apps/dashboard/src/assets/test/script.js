(function () {

  function init() {
    const env = new URLSearchParams(window.location.search).get('env');
    const script = window.document.createElement('script');
    script.type = 'text/javascript';
    script.src =
      env === 'dev'
        ? 'https://cdn.stashify.cloud/nuclia-widget.umd.js'
        : 'https://cdn.rag.progress.cloud/nuclia-widget.umd.js';
    script.onload = () => addWidget();
    window.document.body.appendChild(script);
  }

  function addWidget() {
    const params = new URLSearchParams(window.location.search);
    const { zone, knowledgebox, account, widget_id, mode, apikey, env } = Object.fromEntries(params);

    if (!zone || !knowledgebox || !account || !widget_id || !mode) {
      console.error('Missing URL parameters');
      return;
    }

    const container = document.querySelector('.widget');
    const element = document.createElement(mode === 'page' ? 'nuclia-search-bar' : 'nuclia-chat');
    element.setAttribute('zone', zone);
    element.setAttribute('knowledgebox', knowledgebox);
    element.setAttribute('account', account);
    element.setAttribute('widget_id', widget_id);
    if (apikey) {
      element.setAttribute('apikey', apikey);
      element.setAttribute('state', 'PRIVATE');
    }
    if (env === 'dev') {
      element.setAttribute('backend', 'https://stashify.cloud/api');
      element.setAttribute('cdn', 'https://cdn.stashify.cloud/');
    }

    if (mode === 'page') {
      const searchResults = document.createElement('nuclia-search-results');
      container.appendChild(element);
      container.appendChild(searchResults);
    } else if (mode === 'chat') {
      container.appendChild(element);
      container.classList.add('chat-widget');
    }
  }

  init();
})();
