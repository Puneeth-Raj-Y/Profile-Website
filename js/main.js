// Portfolio JS - No Three.js, GSAP-powered scroll animations
(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  const escapeHtml = (str) =>
    String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const createTag = (label) => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.textContent = label;
    return el;
  };

  const setText = (el, value) => { if (el) el.textContent = value ?? ''; };

  // Year
  const setupYear = () => {
    const y = qs('#year');
    if (y) y.textContent = String(new Date().getFullYear());
  };

  // Header
  const setupHeader = () => {
    const header = qs('[data-elevate]');
    if (!header) return;
    const onScroll = () => header.setAttribute('data-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  };

  // Mobile nav
  const setupMobileNav = () => {
    const toggle = qs('.nav-toggle');
    const menu = qs('.nav-menu');
    if (!toggle || !menu) return;
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    qsa('a[href^="#"]', menu).forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
  };

  // Scroll progress
  const setupScrollProgress = () => {
    const bar = qs('#scroll-progress');
    if (!bar) return;
    const update = () => {
      const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      bar.style.width = `${Math.min(pct, 100)}%`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  };

  // Scroll spy
  const setupScrollSpy = () => {
    const links = qsa('.nav-menu a[href^="#"]');
    const sections = links.map(a => qs(`#${CSS.escape(a.getAttribute('href')?.slice(1))}`)).filter(Boolean);
    if (!sections.length) return;
    const setCurrent = (id) => links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    const io = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setCurrent(visible.target.id);
    }, { threshold: 0.3, rootMargin: '-72px 0px -55% 0px' });
    sections.forEach(s => io.observe(s));
  };

  // Custom cursor
  const setupCursor = () => {
    if (prefersReducedMotion || window.innerWidth < 768) return;
    const dot = qs('#cursor-dot');
    const ring = qs('#cursor-ring');
    if (!dot || !ring) return;
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = `${mx}px`; dot.style.top = `${my}px`;
    });
    const animate = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      ring.style.left = `${rx}px`; ring.style.top = `${ry}px`;
      requestAnimationFrame(animate);
    };
    animate();
    qsa('a, button, [data-magnetic]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        ring.style.width = '60px'; ring.style.height = '60px';
        ring.style.borderColor = 'var(--accent)';
        ring.style.background = 'rgba(124,92,252,0.08)';
        dot.style.opacity = '0';
      });
      el.addEventListener('mouseleave', () => {
        ring.style.width = '40px'; ring.style.height = '40px';
        ring.style.borderColor = 'rgba(124,92,252,0.5)';
        ring.style.background = 'transparent';
        dot.style.opacity = '1';
      });
    });
  };

  // GSAP Animations
  const setupAnimations = () => {
    if (prefersReducedMotion || typeof gsap === 'undefined') {
      qsa('[data-reveal]').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // Hero text reveal
    gsap.from('.hero-tag', { opacity: 0, y: 20, duration: 0.8, delay: 0.2 });
    gsap.from('.hero-headline .word', {
      y: '100%', opacity: 0, duration: 0.9,
      stagger: 0.12, ease: 'power3.out', delay: 0.4
    });
    gsap.from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.8, delay: 1 });
    gsap.from('.hero-actions', { opacity: 0, y: 30, duration: 0.8, delay: 1.2 });
    gsap.from('.hero-visual', { opacity: 0, scale: 0.9, duration: 1, delay: 0.6, ease: 'power2.out' });
    gsap.from('.floating-card', {
      opacity: 0, scale: 0.8, y: 30,
      duration: 0.7, stagger: 0.15, delay: 1, ease: 'back.out(1.7)'
    });
    gsap.from('.scroll-indicator', { opacity: 0, y: 20, duration: 0.6, delay: 1.5 });

    // Scroll reveals
    qsa('[data-reveal]').forEach(el => {
      if (el.closest('.hero')) return;
      gsap.set(el, { opacity: 0, y: 50 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%',
        onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }),
        onLeaveBack: () => gsap.to(el, { opacity: 0, y: 50, duration: 0.4 })
      });
    });

    // Section titles clip-path
    qsa('.section-title').forEach(title => {
      if (title.closest('.hero')) return;
      gsap.fromTo(title,
        { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' },
        { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration: 1, ease: 'power2.out',
          scrollTrigger: { trigger: title, start: 'top 88%', toggleActions: 'play none none none' }
        });
    });

    // Stat cards stagger
    const statCards = qsa('.stat-card');
    if (statCards.length) {
      gsap.set(statCards, { opacity: 0, scale: 0.85, y: 30 });
      ScrollTrigger.create({
        trigger: '.about-stats', start: 'top 88%',
        onEnter: () => gsap.to(statCards, { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.7)' })
      });
    }

    // Bento cards
    const bentoCards = qsa('.bento-card');
    if (bentoCards.length) {
      gsap.set(bentoCards, { opacity: 0, y: 40 });
      ScrollTrigger.create({
        trigger: '.bento-grid', start: 'top 88%',
        onEnter: () => gsap.to(bentoCards, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out' })
      });
    }

    // Project cards
    setTimeout(() => {
      const projCards = qsa('.project-card');
      if (projCards.length) {
        gsap.set(projCards, { opacity: 0, x: 60, scale: 0.92 });
        ScrollTrigger.create({
          trigger: '.projects-scroll-wrapper', start: 'top 90%',
          onEnter: () => gsap.to(projCards, { opacity: 1, x: 0, scale: 1, duration: 0.7, stagger: 0.15, ease: 'power2.out' })
        });
      }
    }, 200);

    // Timeline items
    const tlItems = qsa('.timeline-item');
    if (tlItems.length) {
      gsap.set(tlItems, { opacity: 0, x: -30 });
      ScrollTrigger.create({
        trigger: '.timeline', start: 'top 88%',
        onEnter: () => gsap.to(tlItems, { opacity: 1, x: 0, duration: 0.7, stagger: 0.15, ease: 'power2.out' })
      });
    }

    // Education cards
    const eduCards = qsa('.edu-card');
    if (eduCards.length) {
      gsap.set(eduCards, { opacity: 0, y: 30 });
      ScrollTrigger.create({
        trigger: '.edu-grid', start: 'top 88%',
        onEnter: () => gsap.to(eduCards, { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' })
      });
    }

    // Cert cards
    const certCards = qsa('.cert-card');
    if (certCards.length) {
      gsap.set(certCards, { opacity: 0, y: 25 });
      ScrollTrigger.create({
        trigger: '.certs-grid', start: 'top 88%',
        onEnter: () => gsap.to(certCards, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' })
      });
    }

    // Contact
    const contactCards = qsa('.contact-card');
    if (contactCards.length) {
      gsap.set(contactCards, { opacity: 0, x: 40 });
      ScrollTrigger.create({
        trigger: '.contact-cards', start: 'top 88%',
        onEnter: () => gsap.to(contactCards, { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' })
      });
    }

    // Parallax mesh blobs
    gsap.to('.mesh-blob-1', { y: -100, scrollTrigger: { scrub: 1 } });
    gsap.to('.mesh-blob-2', { y: 80, scrollTrigger: { scrub: 1 } });
    gsap.to('.mesh-blob-3', { x: -60, scrollTrigger: { scrub: 1 } });
  };

  // Render content
  const renderContent = (data) => {
    document.title = `${data?.name ?? 'Portfolio'} | ${data?.title ?? 'Portfolio'}`;
    const desc = qs('meta[name="description"]');
    if (desc) desc.setAttribute('content', `Portfolio of ${data?.name}`);

    qsa('[data-content]').forEach(el => {
      const key = el.getAttribute('data-content');
      if (key && data?.[key]) setText(el, data[key]);
    });

    qsa('[data-link]').forEach(el => {
      const key = el.getAttribute('data-link');
      if (!key) return;
      const v = data?.[key];
      if (key === 'email' && v) el.setAttribute('href', `mailto:${v}`);
      else if (key === 'phone' && v) el.setAttribute('href', `tel:${String(v).replace(/\s/g, '')}`);
      else if (v) el.setAttribute('href', v);
    });

    // Skills
    const tech = qs('#skills-technical');
    const soft = qs('#skills-soft');
    const langs = qs('#languages');
    if (tech) { tech.innerHTML = ''; (data?.skills?.technical ?? []).forEach(s => tech.appendChild(createTag(s))); }
    if (soft) { soft.innerHTML = ''; (data?.skills?.soft ?? []).forEach(s => soft.appendChild(createTag(s))); }
    if (langs) { langs.innerHTML = ''; (data?.languages ?? []).forEach(l => langs.appendChild(createTag(l))); }

    // Projects
    const pg = qs('#projects-grid');
    if (pg) {
      pg.innerHTML = '';
      (data?.projects ?? []).forEach(p => {
        const card = document.createElement('article');
        card.className = 'project-card';
        let linksHtml = '<div class="project-links">';
        if (p?.liveUrl) linksHtml += `<a class="project-link" href="${escapeHtml(p.liveUrl)}" target="_blank" rel="noopener noreferrer"><span>Live Demo</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg></a>`;
        if (p?.repoUrl) linksHtml += `<a class="project-link" href="${escapeHtml(p.repoUrl)}" target="_blank" rel="noopener noreferrer"><span>Source</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg></a>`;
        linksHtml += '</div>';
        card.innerHTML = `
          <span class="impact-badge">${escapeHtml(p?.impact ?? '')}</span>
          <h3>${escapeHtml(p?.title ?? '')}</h3>
          ${p?.problem ? `<p class="problem">"${escapeHtml(p.problem)}"</p>` : ''}
          ${p?.outcome ? `<p class="outcome">→ ${escapeHtml(p.outcome)}</p>` : ''}
          <div class="tech-stack tags" aria-label="Tech stack"></div>
          ${linksHtml}
        `;
        const tags = card.querySelector('.tech-stack');
        (p?.techStack ?? []).forEach(t => tags?.appendChild(createTag(t)));
        pg.appendChild(card);
      });
    }

    // Experience
    const exp = qs('#experience-list');
    if (exp) {
      exp.innerHTML = '';
      (data?.experience ?? []).forEach(x => {
        const item = document.createElement('article');
        item.className = 'timeline-item';
        item.setAttribute('data-reveal', '');
        const bits = [x?.company, x?.location, x?.duration].filter(Boolean);
        item.innerHTML = `
          <h3>${escapeHtml(x?.title ?? '')}</h3>
          <div class="meta">${bits.map(m => `<span>${escapeHtml(m)}</span>`).join(' · ')}</div>
          <ul class="list"></ul>
          <div class="tags" aria-label="Tech stack"></div>
        `;
        const ul = qs('.list', item);
        (x?.highlights ?? []).forEach(h => { const li = document.createElement('li'); li.textContent = h; ul?.appendChild(li); });
        const tags = qs('.tags', item);
        (x?.techStack ?? []).forEach(t => tags?.appendChild(createTag(t)));
        exp.appendChild(item);
      });
    }

    // Education
    const edu = qs('#education-grid');
    if (edu) {
      edu.innerHTML = '';
      (data?.education ?? []).forEach(e => {
        const card = document.createElement('article');
        card.className = 'edu-card';
        card.setAttribute('data-reveal', '');
        card.innerHTML = `<h3>${escapeHtml(e?.degree ?? '')}</h3><div class="meta"><span>${escapeHtml(e?.institution ?? '')}</span><span>${escapeHtml(e?.year ?? '')}</span></div>`;
        edu.appendChild(card);
      });
    }

    // Certifications
    const certs = qs('#certifications-list');
    if (certs) {
      certs.innerHTML = '';
      (data?.certifications ?? []).forEach(c => {
        const card = document.createElement('article');
        card.className = 'cert-card';
        card.setAttribute('data-reveal', '');
        const extra = [c?.provider, c?.date].filter(Boolean).join(' · ');
        card.innerHTML = `
          <div class="cert-icon">🏆</div>
          <div>
            <h3>${escapeHtml(c?.title ?? '')}</h3>
            <div class="meta"><span>${escapeHtml(extra)}</span></div>
            ${c?.details ? `<p style="font-size:.8rem;color:var(--text-2);margin-top:.25rem">${escapeHtml(c.details)}</p>` : ''}
          </div>
        `;
        certs.appendChild(card);
      });
    }

    // Activities
    const acts = qs('#activities-list');
    if (acts && data?.activities?.length) {
      acts.closest('.section').style.display = '';
      acts.innerHTML = '';
      (data.activities).forEach(a => {
        const card = document.createElement('article');
        card.className = 'cert-card';
        card.setAttribute('data-reveal', '');
        const extra = [a?.event, a?.organizer, a?.role].filter(Boolean).join(' · ');
        card.innerHTML = `<div class="cert-icon">🎯</div><div><h3>${escapeHtml(a?.title ?? '')}</h3><div class="meta"><span>${escapeHtml(extra)}</span></div></div>`;
        acts.appendChild(card);
      });
    }
  };

  const loadContent = async () => {
    try {
      const res = await fetch('data/content.json', { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch {}
    const el = qs('#site-content');
    if (!el) return null;
    try { return JSON.parse(el.textContent?.trim()); } catch { return null; }
  };

  const init = async () => {
    setupYear();
    setupHeader();
    setupMobileNav();
    setupScrollProgress();
    setupScrollSpy();

    const data = await loadContent();
    if (data) renderContent(data);

    try { setupAnimations(); } catch (e) { console.warn('Animations failed:', e); }
    setupCursor();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();