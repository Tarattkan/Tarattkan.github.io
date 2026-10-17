(() => {
  'use strict';
  document.documentElement.classList.remove('no-js');
  const nav = document.querySelector('.main-nav');
  const menu = document.querySelector('.menu-toggle');
  const navLinks = [...nav.querySelectorAll('a')];
  const languageButtons = [...document.querySelectorAll('[data-language]')];
  const publications = [...document.querySelectorAll('.publication')];
  const filters = [...document.querySelectorAll('.filter-button')];
  const search = document.querySelector('#publication-search');
  const status = document.querySelector('#result-count');
  const empty = document.querySelector('.empty-state');
  const copyButton = document.querySelector('.copy-email');
  const copyStatus = document.querySelector('.copy-status');
  const preferenceKey = 'portfolio-language';
  let language = 'th';
  let selectedFilter = 'all';
  let copyResult = '';
  const messages = {
    th: { openMenu: 'เปิดเมนูหลัก', closeMenu: 'ปิดเมนูหลัก', copied: 'คัดลอกอีเมลแล้ว', selected: 'เลือกอีเมลให้แล้ว กดคัดลอกหรือ Ctrl/Cmd+C' },
    en: { openMenu: 'Open main menu', closeMenu: 'Close main menu', copied: 'Email copied', selected: 'Email selected. Copy it or press Ctrl/Cmd+C.' }
  };
  // Read plain text only. Translations are never interpreted as HTML.
  const translatedText = [...document.querySelectorAll('[data-en]')].map(element => {
    const original = element.cloneNode(true);
    original.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return { element, th: original.textContent, en: element.dataset.en || original.textContent };
  });
  const translatedAttributes = ['aria-label', 'title', 'alt', 'placeholder', 'content'].flatMap(attribute =>
    [...document.querySelectorAll('[data-' + attribute + '-en]')].map(element => ({
      element, attribute, th: element.getAttribute(attribute),
      en: element.getAttribute('data-' + attribute + '-en') || element.getAttribute(attribute)
    }))
  );
  function updateMenuLabel() {
    menu.setAttribute('aria-label', messages[language][menu.getAttribute('aria-expanded') === 'true' ? 'closeMenu' : 'openMenu']);
  }
  function closeMenu() {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    updateMenuLabel();
  }
  function filterPublications() {
    const query = search.value.toLocaleLowerCase().trim();
    let count = 0;
    publications.forEach(paper => {
      // An invariant bilingual corpus preserves results when language changes.
      const corpus = (paper.dataset.search || paper.textContent + ' ' + paper.dataset.topic).toLocaleLowerCase();
      const matchesType = selectedFilter === 'all' || paper.dataset.type === selectedFilter;
      const matchesQuery = query.split(/\s+/).every(term => corpus.includes(term));
      paper.hidden = !(matchesType && matchesQuery);
      if (!paper.hidden) count++;
    });
    filters.forEach(button => {
      const active = button.dataset.filter === selectedFilter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    status.textContent = language === 'en'
      ? 'Showing ' + count + ' publication' + (count === 1 ? '' : 's') + (query ? ' for “' + search.value.trim() + '”' : '')
      : 'แสดง ' + count + ' ผลงาน' + (query ? ' จากคำค้น “' + search.value.trim() + '”' : '');
    empty.hidden = count !== 0;
  }
  function setLanguage(next, remember = false) {
    language = next === 'en' ? 'en' : 'th';
    document.documentElement.lang = language;
    translatedText.forEach(item => { item.element.textContent = item[language]; });
    translatedAttributes.forEach(item => { item.element.setAttribute(item.attribute, item[language]); });
    languageButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    updateMenuLabel();
    filterPublications();
    if (copyResult) copyStatus.textContent = messages[language][copyResult];
    if (remember) {
      try { localStorage.setItem(preferenceKey, language); } catch { /* Optional preference storage may be blocked. */ }
    }
  }
  try { language = localStorage.getItem(preferenceKey) === 'en' ? 'en' : 'th'; } catch { /* Thai remains the default. */ }
  setLanguage(language);
  const languageSwitch = document.querySelector('.language-switch');
  if (languageSwitch) languageSwitch.hidden = false;
  document.querySelector('.research-tools').hidden = false;
  status.hidden = false;
  menu.hidden = false;
  copyButton.hidden = false;
  languageButtons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language, true)));
  menu.addEventListener('click', () => {
    const opened = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(opened));
    updateMenuLabel();
    nav.classList.toggle('open', opened);
  });
  navLinks.forEach(link => link.addEventListener('click', () => {
    closeMenu();
    const destination = document.querySelector(link.getAttribute('href'));
    if (destination) {
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
    }
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  let pending = false;
  function setActiveSection() {
    const offset = document.querySelector('.site-header').offsetHeight + 100;
    let active = sections[0].id;
    for (const section of sections) if (section.getBoundingClientRect().top <= offset) active = section.id;
    navLinks.forEach(link => {
      const selected = link.getAttribute('href') === '#' + active;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    pending = false;
  }
  window.addEventListener('scroll', () => {
    if (!pending) { pending = true; window.requestAnimationFrame(setActiveSection); }
  }, { passive: true });
  window.addEventListener('resize', () => { if (window.innerWidth > 1100) closeMenu(); setActiveSection(); });
  setActiveSection();
  filters.forEach(button => button.addEventListener('click', () => {
    selectedFilter = button.dataset.filter;
    filterPublications();
  }));
  search.addEventListener('input', filterPublications);
  document.querySelector('#reset-search').addEventListener('click', () => {
    search.value = '';
    selectedFilter = 'all';
    filterPublications();
    search.focus({ preventScroll: true });
  });
  copyButton.addEventListener('click', async () => {
    const email = document.querySelector('.email-link').textContent.trim();
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(email);
      copyResult = 'copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('.email-link'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyResult = 'selected';
    }
    copyStatus.textContent = messages[language][copyResult];
  });
})();
