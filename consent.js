/* Instinct analytics consent - first-party, no third-party geo/CMP.
   Basic mode: no gtag.js and no Google request until explicit Accept.
   Decline/no-choice = gtag never loads. Choice stored in localStorage.
   Includes always-available "Analytics settings" link to change/revoke:
   revoking disables GA for the property, updates consent to denied and
   deletes _ga cookies; no further hits are sent. */
(function () {
  var GA_ID = window.__GA_MEASUREMENT_ID__; // set per site before this script
  if (!GA_ID) return;
  var KEY = 'analytics_consent_v1';
  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}

  function gtagSafe() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    return window.gtag;
  }

  function loadGA() {
    if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    var gtag = gtagSafe();
    gtag('js', new Date());
    gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    gtag('config', GA_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }

  function deleteGACookies() {
    var names = ['_ga'];
    (document.cookie || '').split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n === '_ga' || n.indexOf('_ga_') === 0) names.push(n);
    });
    var domains = [location.hostname, '.' + location.hostname,
      '.' + location.hostname.split('.').slice(-2).join('.')];
    names.forEach(function (n) {
      domains.forEach(function (d) {
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + d;
      });
      document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });
  }

  function revokeGA() {
    window['ga-disable-' + GA_ID] = true;               // GA4 honors the disable flag
    try { gtagSafe()('consent', 'update', { analytics_storage: 'denied' }); } catch (e) {}
    deleteGACookies();
  }

  function remember(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function removeBar() { var el = document.getElementById('ga-consent-bar'); if (el) el.remove(); }

  var css = '#ga-consent-bar{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;'
    + 'background:#111;color:#eee;font:14px/1.45 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;'
    + 'padding:12px 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;'
    + 'box-shadow:0 -2px 12px rgba(0,0,0,.35)}'
    + '#ga-consent-bar p{margin:0;max-width:640px;flex:1 1 320px}'
    + '#ga-consent-bar button{font:inherit;padding:8px 18px;border-radius:6px;border:1px solid #666;cursor:pointer}'
    + '#ga-consent-accept{background:#2f6fed;color:#fff;border-color:#2f6fed}'
    + '#ga-consent-decline{background:transparent;color:#eee}'
    + '#ga-consent-settings{position:fixed;right:10px;bottom:10px;z-index:2147482999;'
    + 'background:rgba(17,17,17,.75);color:#ccc;font:12px/1 -apple-system,Segoe UI,Roboto,sans-serif;'
    + 'padding:6px 10px;border-radius:12px;border:1px solid #555;cursor:pointer}';

  function ensureStyle() {
    if (document.getElementById('ga-consent-style')) return;
    var style = document.createElement('style');
    style.id = 'ga-consent-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showBar() {
    removeBar();
    ensureStyle();
    var bar = document.createElement('div');
    bar.id = 'ga-consent-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie consent');
    var p = document.createElement('p');
    p.textContent = 'We use optional cookies to understand how the site is used and help us improve it. '
      + 'You can accept them or use necessary cookies only. You can change this anytime in Cookie settings.';
    var yes = document.createElement('button');
    yes.id = 'ga-consent-accept'; yes.type = 'button'; yes.textContent = 'Accept all';
    var no = document.createElement('button');
    no.id = 'ga-consent-decline'; no.type = 'button'; no.textContent = 'Necessary only';
    yes.addEventListener('click', function () { remember('accepted'); removeBar(); loadGA(); });
    no.addEventListener('click', function () { remember('declined'); removeBar(); revokeGA(); });
    bar.appendChild(p); bar.appendChild(yes); bar.appendChild(no);
    document.body.appendChild(bar);
  }

  function mountSettings() {
    if (document.getElementById('ga-consent-settings')) return;
    var wrap = document.createElement('span');
    wrap.id = 'ga-consent-settings';
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = 'Cookie settings';
    b.style.cssText = 'background:none;border:none;color:inherit;font:inherit;cursor:pointer;padding:0';
    b.addEventListener('click', showBar);
    var sep = document.createElement('span');
    sep.textContent = ' \u00b7 ';
    var a = document.createElement('a');
    a.href = '/privacy.html'; a.textContent = 'Privacy';
    a.style.color = 'inherit';
    wrap.appendChild(b); wrap.appendChild(sep); wrap.appendChild(a);
    (document.body || document.documentElement).appendChild(wrap);
  }

  function init() {
    ensureStyle();
    mountSettings();
    if (choice === 'accepted') { loadGA(); return; }
    if (choice === 'declined') { return; }
    showBar();
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
