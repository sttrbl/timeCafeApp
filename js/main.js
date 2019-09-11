//Класс для области отображения разделов
class Page {
  constructor(rootElem) {
    this._cache = {};

    this._modules = {
      visits: visitsPageModule,
      archive: archivePageModule,
      settings: settingsPageModule
    };

    this._headlineElem =  helper.create('h1', 'page__headline');
    this._contentContainer =  helper.create('section', 'page__content');

    rootElem.append(this._headlineElem, this._contentContainer);
  }


  set headline(text) {
    this._headlineElem.textContent = text;
    document.title = text;
  }


  set content(contentElems) {
    this._contentContainer.innerHTML = '';
    this._contentContainer.append(...contentElems);
  }


  get content() {
    return [...this._contentContainer.children];
  }


  async render(pageName) {
    if (this._currentPageName) {
      this._cache[this._currentPageName] = this.content;
    }

    const pagesRussianNames = {
      visits: 'Посещения',
      archive: 'Архив',
      settings: 'Настройки'
    };

    if (this._cache[pageName]) {
      this.content = this._cache[pageName];
    } else {
      this.content = await this._modules[pageName].getPageContent();
    }

    this._currentPageName = pageName;
    this.headline = pagesRussianNames[pageName];
  }
};

const navMenuElem = document.querySelector('.menu');
const layoutBodyElem = document.querySelector('.layout__body');
const sidebarElem = document.querySelector('.layout__sidebar');
const sidebarToggleBtn = document.querySelector('.btn-sidebar-toggle');
const alertElem = document.querySelector('.alert');
const page = new Page( document.querySelector('.page') );

alertElem.style.width = `${layoutBodyElem.offsetWidth}px`;


alertElem.addEventListener('transitionend', e => {
  if (e.propertyName == 'height') {
    alertElem.style.opacity = 0;
    alertElem.style.height = '';
  }
});


window.addEventListener(`resize`, e => {
  alertElem.style.width = `${layoutBodyElem.offsetWidth}px`;
});


document.addEventListener('input', e => {
  if ( !e.target.matches('[type = "text"]') ) return;

  e.target.value = e.target.value.replace(/^\s*(.*)$/, '$1');
});


document.addEventListener('change', e => {
  if ( !e.target.matches('[type = "text"]') ) return;

  e.target.value = e.target.value.trim().replace(/\s+/g, ' ');
});


sidebarToggleBtn.addEventListener('click', e => {
  toggleSidebar();
});


layoutBodyElem.addEventListener('click', e => {
  if ( sidebarElem.matches('.opened') && !e.target.closest('.mobile-header') ) {
    toggleSidebar();
  }
});


navMenuElem.addEventListener('click', e => {
  e.preventDefault();

  const menuLinkElem = e.target.closest('.menu__link');
  const activeMenuLinkElem = e.currentTarget.querySelector('.current');

  if ( !menuLinkElem || (menuLinkElem == activeMenuLinkElem) ) return;

  if ( sidebarElem.matches('.opened') ) toggleSidebar();


  page.render( menuLinkElem.getAttribute('href') )
    .then(() => {
      activeMenuLinkElem.classList.remove('current');
      menuLinkElem.classList.add('current');
    })
    .catch(error => {
      console.log(`Ошибка загрузки раздела: ${error.message}`);
    });

});


function toggleSidebar() {
  layoutBodyElem.classList.toggle('shifted');
  sidebarElem.classList.toggle('opened');
  sidebarElem.style.top = 0;
}

page.render('visits');
