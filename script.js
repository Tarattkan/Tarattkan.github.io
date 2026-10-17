(() => {
  'use strict';
  document.documentElement.classList.remove('no-js');
  const nav = document.querySelector('.main-nav');
  const menu = document.querySelector('.menu-toggle');
  const navLinks = [...nav.querySelectorAll('a')];
  menu.hidden = false;
  function closeMenu() {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'เปิดเมนูหลัก');
  }
  menu.addEventListener('click', () => {
    const opened = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(opened));
    menu.setAttribute('aria-label', opened ? 'ปิดเมนูหลัก' : 'เปิดเมนูหลัก');
    nav.classList.toggle('open', opened);
  });
  navLinks.forEach(link => link.addEventListener('click', () => {
    closeMenu();
    const destination = document.querySelector(link.getAttribute('href'));
    destination.setAttribute('tabindex', '-1');
    destination.focus({ preventScroll: true });
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
  let pending = false;
  function setActiveSection() {
    const offset = document.querySelector('.site-header').offsetHeight + 100;
    let active = sections[0].id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= offset) active = section.id;
    }
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
  window.addEventListener('resize', () => { if (window.innerWidth > 820) closeMenu(); setActiveSection(); });
  setActiveSection();

  const publications = [...document.querySelectorAll('.publication')];
  const filters = [...document.querySelectorAll('.filter-button')];
  const search = document.querySelector('#publication-search');
  const status = document.querySelector('#result-count');
  const empty = document.querySelector('.empty-state');
  let selectedFilter = 'all';
  document.querySelector('.research-tools').hidden = false;
  status.hidden = false;
  function filterPublications() {
    const query = search.value.toLocaleLowerCase().trim();
    let count = 0;
    publications.forEach(paper => {
      const corpus = (paper.textContent + ' ' + paper.dataset.topic).toLocaleLowerCase();
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
    status.textContent = 'แสดง ' + count + ' ผลงาน' + (query ? ' จากคำค้น “' + search.value.trim() + '”' : '');
    empty.hidden = count !== 0;
  }
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


  const copyButton = document.querySelector('.copy-email');
  const copyStatus = document.querySelector('.copy-status');
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    const email = document.querySelector('.email-link').textContent.trim();
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(email);
      copyStatus.textContent = 'คัดลอกอีเมลแล้ว';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('.email-link'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = 'เลือกอีเมลให้แล้ว กดคัดลอกหรือ Ctrl/Cmd+C';
    }
  });
})();
