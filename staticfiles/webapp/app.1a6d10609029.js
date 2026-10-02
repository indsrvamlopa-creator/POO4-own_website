const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-navigation');
const hero = document.querySelector('.hero');
const heroImage = document.querySelector('.hero-image');
const heroProduct = document.querySelector('.hero-product');
const headlineStates = [...document.querySelectorAll('.headline-state')];
const agentSection = document.querySelector('.agent-section');
const agentStages = [...document.querySelectorAll('.agent-stage')];
const agentOutput = {
  label: document.querySelector('#agent-output-label'),
  request: document.querySelector('#agent-request'),
  step: document.querySelector('#agent-output-step'),
  title: document.querySelector('#agent-output-title'),
  copy: document.querySelector('#agent-output-copy'),
  progress: document.querySelector('#agent-progress-fill'),
};
const progressBar = document.querySelector('.scroll-progress');
const progressFill = progressBar.querySelector('span');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const aiSteps = [...document.querySelectorAll('.ai-story-step')];
const aiPanels = [...document.querySelectorAll('[data-ai-visual]')];
const aiVisualIndex = document.querySelector('#ai-visual-index');
const aiVisualTitle = document.querySelector('#ai-visual-title');
const aiVisualDescription = document.querySelector('#ai-visual-description');
const productSelectors = [...document.querySelectorAll('[data-product-select]')];
const productPanels = [...document.querySelectorAll('[data-product-panel]')];
const productSteps = [...document.querySelectorAll('[data-product-step]')];
const productCurrent = document.querySelector('[data-product-current]');
const productProgress = document.querySelector('[data-product-progress]');
const productProgressBar = document.querySelector('.product-progress');
const messageInput = document.querySelector('#id_message');
const messageCount = document.querySelector('#message-count');
let scrollFrame = 0;

if (!reducedMotion) root.classList.add('motion-ready');

function closeMenu() {
  header.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
}

function revealHeadlineState(index) {
  headlineStates.forEach((state, stateIndex) => {
    const active = stateIndex === index;
    state.classList.toggle('is-active', active);
    state.classList.remove('is-entering');
    state.setAttribute('aria-hidden', String(!active));
    if (active) requestAnimationFrame(() => state.classList.add('is-entering'));
  });
}

if (!reducedMotion && headlineStates.length > 1) {
  let headlineIndex = 0;
  const advanceHeadline = () => {
    headlineIndex += 1;
    revealHeadlineState(headlineIndex);
    if (headlineIndex < headlineStates.length - 1) window.setTimeout(advanceHeadline, 1900);
  };
  window.setTimeout(advanceHeadline, 1850);
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
  header.classList.toggle('menu-open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateScrollState() {
  scrollFrame = 0;
  const scrollPosition = window.scrollY;
  const availableScroll = document.documentElement.scrollHeight - window.innerHeight;
  const pageProgress = availableScroll > 0 ? scrollPosition / availableScroll : 0;
  progressFill.style.transform = `scaleX(${pageProgress})`;
  progressBar.setAttribute('aria-valuenow', String(Math.round(pageProgress * 100)));
  header.classList.toggle('is-scrolled', scrollPosition > 12);

  if (!reducedMotion) {
    const heroProgress = clamp(-hero.getBoundingClientRect().top / Math.max(1, hero.offsetHeight), 0, 1);
    hero.style.setProperty('--hero-progress', heroProgress.toFixed(3));
    hero.style.setProperty('--hero-copy-scale', (1 - heroProgress * .045).toFixed(3));
    hero.style.setProperty('--hero-copy-y', `${-heroProgress * 22}px`);
    heroImage.style.setProperty('--hero-image-scale', (1.08 - heroProgress * .09).toFixed(3));
    heroImage.style.setProperty('--hero-image-y', `${heroProgress * 24}px`);
  }
}

function requestScrollUpdate() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(updateScrollState);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
updateScrollState();

const revealTargets = [...document.querySelectorAll('.reveal, .word-reveal')];
if ('IntersectionObserver' in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
  revealTargets.forEach((item) => revealObserver.observe(item));
} else {
  revealTargets.forEach((item) => item.classList.add('is-visible'));
}

function selectProduct(index) {
  if (!productSelectors.length) return;
  const selectedIndex = (index + productSelectors.length) % productSelectors.length;
  const selectedButton = productSelectors[selectedIndex];
  const selectedPanel = productPanels.find((panel) => panel.dataset.productPanel === selectedButton.dataset.productSelect);
  if (!selectedPanel) return;

  productSelectors.forEach((button, buttonIndex) => {
    const isSelected = buttonIndex === selectedIndex;
    button.classList.toggle('is-active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
  productPanels.forEach((panel) => {
    const isSelected = panel === selectedPanel;
    panel.hidden = !isSelected;
    panel.classList.toggle('is-active', isSelected);
    panel.classList.remove('is-entering');
  });
  productCurrent.textContent = String(selectedIndex + 1).padStart(2, '0');
  productProgress.style.transform = `scaleX(${(selectedIndex + 1) / productSelectors.length})`;
  productProgressBar.setAttribute('aria-valuenow', String(selectedIndex + 1));
  selectedPanel.querySelectorAll('.reveal, .word-reveal').forEach((item) => item.classList.add('is-visible'));
  requestAnimationFrame(() => selectedPanel.classList.add('is-entering'));
}

productSelectors.forEach((button, index) => {
  button.addEventListener('click', () => selectProduct(index));
});
productSteps.forEach((button) => {
  button.addEventListener('click', () => {
    const currentIndex = productSelectors.findIndex((selector) => selector.getAttribute('aria-pressed') === 'true');
    selectProduct(currentIndex + Number(button.dataset.productStep));
  });
});
document.querySelector('.product-selector')?.addEventListener('keydown', (event) => {
  if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;
  event.preventDefault();
  const currentIndex = productSelectors.indexOf(document.activeElement);
  const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
  const nextIndex = (currentIndex + direction + productSelectors.length) % productSelectors.length;
  productSelectors[nextIndex].focus();
  selectProduct(nextIndex);
});

function setAiScene(step) {
  const scene = step.dataset.aiStep;
  aiSteps.forEach((item) => item.classList.toggle('is-active', item === step));
  aiPanels.forEach((panel) => { panel.hidden = panel.dataset.aiVisual !== scene; });
  aiVisualIndex.textContent = `${step.dataset.stage} / 04`;
  aiVisualTitle.textContent = step.querySelector('h3').textContent;
  aiVisualDescription.textContent = step.querySelector('p').textContent;
}

const agentStepContent = [
  ['INCOMING REQUEST / TEXT', '“Find the latest project brief and share the current status.”', 'A person asks', 'The agent receives a natural-language request and keeps its intent attached to the task.'],
  ['INTENT / PROJECT STATUS', 'Intent: locate the current brief and summarize its status.', 'Understand the request', 'Language is resolved into a task, entities and an allowed set of actions.'],
  ['REASONING / POLICY CHECK', 'Project Atlas → latest approved brief → status summary.', 'Plan with context', 'Relevant context is gathered from approved sources before any tool is called.'],
  ['TOOL EXECUTION / READ-ONLY', 'Search workspace  ·  retrieve brief  ·  verify timestamp', 'Use connected tools', 'The agent calls permitted systems and keeps the steps visible and traceable.'],
  ['RESULT / HUMAN REVIEW', '“The latest brief is v3, updated today. The project is in design review.”', 'Return a useful result', 'A concise answer returns with its source so a person can verify or continue.'],
];
let agentWasManuallyControlled = false;
let agentCycleTimer = 0;

function setAgentStage(index) {
  const boundedIndex = clamp(index, 0, agentStepContent.length - 1);
  const [label, request, title, copy] = agentStepContent[boundedIndex];
  agentStages.forEach((stage, stageIndex) => {
    const isActive = stageIndex === boundedIndex;
    stage.classList.toggle('is-active', isActive);
    stage.setAttribute('aria-selected', String(isActive));
  });
  agentOutput.label.textContent = label;
  agentOutput.request.textContent = request;
  agentOutput.step.textContent = `STEP ${String(boundedIndex + 1).padStart(2, '0')} / 05`;
  agentOutput.title.textContent = title;
  agentOutput.copy.textContent = copy;
  agentOutput.progress.style.width = `${((boundedIndex + 1) / agentStepContent.length) * 100}%`;
  agentOutput.title.classList.remove('agent-text-enter');
  requestAnimationFrame(() => agentOutput.title.classList.add('agent-text-enter'));
}

agentStages.forEach((stage) => {
  stage.addEventListener('click', () => {
    agentWasManuallyControlled = true;
    window.clearInterval(agentCycleTimer);
    setAgentStage(Number(stage.dataset.agentStage));
  });
});

if ('IntersectionObserver' in window) {
  const aiStoryObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setAiScene(entry.target);
    });
  }, { rootMargin: '-38% 0px -42% 0px', threshold: 0 });
  aiSteps.forEach((step) => aiStoryObserver.observe(step));

  let agentVisible = false;
  const agentObserver = new IntersectionObserver(([entry]) => {
    agentVisible = entry.isIntersecting;
    if (!agentVisible) {
      window.clearInterval(agentCycleTimer);
      agentCycleTimer = 0;
      return;
    }
    if (agentWasManuallyControlled || reducedMotion || agentCycleTimer) return;
    agentCycleTimer = window.setInterval(() => {
      const current = agentStages.findIndex((stage) => stage.classList.contains('is-active'));
      setAgentStage((current + 1) % agentStages.length);
    }, 2100);
  }, { threshold: .45 });
  agentObserver.observe(agentSection);

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (entry.target.matches('.contact-section')) entry.target.classList.add('is-active');
      navigation.querySelectorAll('a').forEach((link) => {
        link.classList.toggle('is-active', link.hash === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-32% 0px -58% 0px', threshold: 0 });
  navigation.querySelectorAll('a[href^="#"]').forEach((link) => {
    const target = document.querySelector(link.hash);
    if (target) sectionObserver.observe(target);
  });
  sectionObserver.observe(document.querySelector('.contact-section'));
} else {
  document.querySelector('.contact-section').classList.add('is-active');
}

const counters = [...document.querySelectorAll('[data-count]')];
function animateCounter(counter) {
  const target = Number(counter.dataset.count);
  if (reducedMotion) {
    counter.textContent = String(target).padStart(2, '0');
    return;
  }
  const duration = 850;
  const start = performance.now();
  function tick(now) {
    const progress = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = String(Math.round(target * eased)).padStart(2, '0');
    if (progress < 1) window.requestAnimationFrame(tick);
  }
  window.requestAnimationFrame(tick);
}

if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: .5 });
  counters.forEach((counter) => counterObserver.observe(counter));
} else {
  counters.forEach(animateCounter);
}

document.querySelectorAll('[data-legal-open]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector(`#${button.dataset.legalOpen}-dialog`).showModal();
  });
});
document.querySelectorAll('.legal-dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

if (messageInput && messageCount) {
  const updateMessageCount = () => { messageCount.textContent = messageInput.value.length; };
  messageInput.addEventListener('input', updateMessageCount);
  updateMessageCount();
}

document.querySelectorAll('.toast').forEach((toast) => {
  window.setTimeout(() => toast.remove(), 6000);
});

if (finePointer && !reducedMotion) {
  document.querySelectorAll('[data-magnetic]').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .08;
      const y = (event.clientY - rect.top - rect.height / 2) * .08;
      button.style.setProperty('--mag-x', `${clamp(x, -6, 6)}px`);
      button.style.setProperty('--mag-y', `${clamp(y, -5, 5)}px`);
    });
    button.addEventListener('pointerleave', () => {
      button.style.setProperty('--mag-x', '0px');
      button.style.setProperty('--mag-y', '0px');
    });
  });

  document.querySelectorAll('.capability-card').forEach((card) => {
    const image = card.querySelector('img');
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--glow-x', `${x * 100}%`);
      card.style.setProperty('--glow-y', `${y * 100}%`);
      card.style.setProperty('--card-tilt-x', `${(0.5 - y) * 2.2}deg`);
      card.style.setProperty('--card-tilt-y', `${(x - 0.5) * 2.8}deg`);
      image.style.setProperty('--image-x', `${(x - .5) * 5}px`);
      image.style.setProperty('--image-y', `${(y - .5) * 5}px`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--card-tilt-x', '0deg');
      card.style.setProperty('--card-tilt-y', '0deg');
      image.style.setProperty('--image-x', '0px');
      image.style.setProperty('--image-y', '0px');
    });
  });

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    hero.querySelector('.hero-grid').style.transform = `translate3d(${x * 7}px, ${y * 5}px, 0)`;
    if (heroProduct) {
      heroProduct.style.setProperty('--tilt-x', `${1 - y * 2.4}deg`);
      heroProduct.style.setProperty('--tilt-y', `${-5 + x * 3.2}deg`);
    }
  });
  hero.addEventListener('pointerleave', () => {
    hero.querySelector('.hero-grid').style.transform = '';
    if (heroProduct) {
      heroProduct.style.setProperty('--tilt-x', '1deg');
      heroProduct.style.setProperty('--tilt-y', '-5deg');
    }
  });
}

const sampleMetrics = [...document.querySelectorAll('[data-metric]')];
function animateSampleMetric(element) {
  const target = Number(element.dataset.metric);
  const prefix = element.dataset.prefix || '';
  const suffix = element.dataset.suffix || '';
  const formatter = new Intl.NumberFormat('en-US');
  if (reducedMotion) {
    element.textContent = `${prefix}${formatter.format(target)}${suffix}`;
    return;
  }
  const startedAt = performance.now();
  const duration = 1450;
  function update(now) {
    const ratio = clamp((now - startedAt) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - ratio, 3);
    element.textContent = `${prefix}${formatter.format(Math.round(target * eased))}${suffix}`;
    if (ratio < 1) window.requestAnimationFrame(update);
  }
  window.requestAnimationFrame(update);
}

if ('IntersectionObserver' in window) {
  const metricObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateSampleMetric(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: .55 });
  sampleMetrics.forEach((metric) => metricObserver.observe(metric));
} else {
  sampleMetrics.forEach(animateSampleMetric);
}

const loader = document.querySelector('.site-loader');
loader.addEventListener('animationend', (event) => {
  if (event.animationName === 'loader-exit') loader.remove();
});
window.setTimeout(() => loader.remove(), reducedMotion ? 150 : 1250);
