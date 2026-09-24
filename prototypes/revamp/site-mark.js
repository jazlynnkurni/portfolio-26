/* ============================================================================
 * site-mark.js  the JK mark as a component.
 *
 * Drop it in the head once and use the element anywhere:
 *     <site-mark></site-mark>            the mark, on the home page
 *     <site-mark href="/"></site-mark>   the mark as the way home
 *
 * It stands ALONE at the head's left, no wordmark: the mark carries the name.
 * The postage die, locked from the JK lab: oxblood on stock, the toothed edge,
 * the letters solid because at this size the halftone is finer than the strokes.
 * Loaded from the head so it paints styled without a flash. Keep the tag empty.
 * ========================================================================= */
(function () {
  'use strict';
  if (!document.getElementById('site-mark-styles')) {
    var st = document.createElement('style');
    st.id = 'site-mark-styles';
    st.textContent =
      'site-mark{display:inline-block;line-height:0;pointer-events:auto}' +
      'site-mark .sm{position:relative;display:inline-grid;place-items:center;width:1em;height:1em;' +
        'font-size:clamp(24px,2.6vw,34px);background:#f4efe3;text-decoration:none;--r:7%;' +
        '-webkit-mask:radial-gradient(circle at 0 0,transparent var(--r),#000 calc(var(--r) + .5px)) 0 0/16.66% 16.66% repeat;' +
        'mask:radial-gradient(circle at 0 0,transparent var(--r),#000 calc(var(--r) + .5px)) 0 0/16.66% 16.66% repeat}' +
      'site-mark .sm i{position:absolute;inset:14%;border:1px solid #340414;opacity:.85}' +
      'site-mark .sm b{position:relative;font:700 .42em/1 var(--jak,"Plus Jakarta Sans",sans-serif);letter-spacing:-.06em;color:#340414}';
    document.head.appendChild(st);
  }
  function markup(el) {
    var href = el.getAttribute('href');
    var inner = '<i></i><b>JK</b>';
    return href
      ? '<a class="sm" href="' + href + '" aria-label="Home, JK">' + inner + '</a>'
      : '<span class="sm" role="img" aria-label="JK">' + inner + '</span>';
  }
  if (window.customElements && !customElements.get('site-mark')) {
    customElements.define('site-mark', class extends HTMLElement {
      connectedCallback() { if (this.__r) return; this.__r = true; this.innerHTML = markup(this); }
    });
  }
})();
