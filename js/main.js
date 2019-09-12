class Page {
  constructor(rootElem) {
    this.cache = {};

    this.modules = {
      visits: visitsPageModule,
      archive: archivePageModule,
      settings: settingsPageModule,
    };

    this.headlineElem = helper.create('h1', 'page__headline');
    this.contentContainer = helper.create('section', 'page__content');

    rootElem.append(this.headlineElem, this.contentContainer);
  }


  set headline(text) {
    this.headlineElem.textContent = text;
    document.title = text;
  }


  set content(contentElems) {
    this.contentContainer.innerHTML = '';
    this.contentContainer.append(...contentElems);
  }


  get content() {
    return [...this.contentContainer.children];
  }


  async render(pageName) {
    if (this.currentPageName) {
      this.cache[this.currentPageName] = this.content;
    }

    const pagesRussianNames = {
      visits: 'Посещения',
      archive: 'Архив',
      settings: 'Настройки',
    };

    if (this.cache[pageName]) {
      this.content = this.cache[pageName];
    } else {
      this.content = await this.modules[pageName].getPageContent();
    }

    this.currentPageName = pageName;
    this.headline = pagesRussianNames[pageName];
  }
}

const navMenuElem = document.querySelector('.menu');
const layoutBodyElem = document.querySelector('.layout__body');
const sidebarElem = document.querySelector('.layout__sidebar');
const sidebarToggleBtn = document.querySelector('.btn-sidebar-toggle');
const alertElem = document.querySelector('.alert');
const page = new Page(document.querySelector('.page'));

const toggleSidebar = () => {
  layoutBodyElem.classList.toggle('shifted');
  sidebarElem.classList.toggle('opened');
  sidebarElem.style.top = 0;
};


alertElem.style.width = `${layoutBodyElem.offsetWidth}px`;


alertElem.addEventListener('transitionend', (e) => {
  if (e.propertyName === 'height') {
    alertElem.style.opacity = 0;
    alertElem.style.height = '';
  }
});


window.addEventListener('resize', () => {
  alertElem.style.width = `${layoutBodyElem.offsetWidth}px`;
});


document.addEventListener('input', (e) => {
  if (!e.target.matches('[type = "text"]')) return;

  e.target.value = e.target.value.replace(/^\s*(.*)$/, '$1');
});


document.addEventListener('change', (e) => {
  if (!e.target.matches('[type = "text"]')) return;

  e.target.value = e.target.value.trim().replace(/\s+/g, ' ');
});


sidebarToggleBtn.addEventListener('click', () => toggleSidebar());


layoutBodyElem.addEventListener('click', (e) => {
  if (sidebarElem.matches('.opened') && !e.target.closest('.mobile-header')) {
    toggleSidebar();
  }
});


navMenuElem.addEventListener('click', (e) => {
  e.preventDefault();

  const menuLinkElem = e.target.closest('.menu__link');
  const activeMenuLinkElem = e.currentTarget.querySelector('.current');

  if (!menuLinkElem || (menuLinkElem === activeMenuLinkElem)) return;

  if (sidebarElem.matches('.opened')) toggleSidebar();


  page.render(menuLinkElem.getAttribute('href'))
    .then(() => {
      activeMenuLinkElem.classList.remove('current');
      menuLinkElem.classList.add('current');
    })
    .catch((error) => {
      console.log(`Ошибка загрузки раздела: ${error.message}`);
    });
});

page.render('visits');
