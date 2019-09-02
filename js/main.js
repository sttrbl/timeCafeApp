//Класс для области отображения разделов
class Page {

	constructor(rootElem) {
		this._rootElem = rootElem;
		this._cache = {};

		this._modules = {
			visits: visitsPageModule,
			arhive: visitsPageModule,
			settings: settingsPageModule
		};

		this._headlineElem =  document.createElement('h1'); 
		this._headlineElem.className = 'page__headline';

		this._contentContainer =  document.createElement('section'); 
		this._contentContainer.className = 'page__content';

		this._rootElem.append(this._headlineElem, this._contentContainer);
	}

	set headline(text) {
		this._headlineElem.textContent = text;
		document.title = text;
	}

	set content(contentElems) {
		this._contentContainer.innerHTML = '';
		this._contentContainer.append(...contentElems);
	}

	render(pageName) {
		const pagesRussianNames = {
			visits: 'Посещения',
			archive: 'Архив',
			settings: 'Настройки'
		}
			
		if (this._cache[pageName]) {
			this.headline = pagesRussianNames[pageName];
			this.content = this._cache[pageName]; 
			return;
		} 
		
		this._modules[pageName].getPageContent()
			.then(pageContent => {
				this.headline = pagesRussianNames[pageName];
				this.content = pageContent; 
				this._cache[pageName] = pageContent;
			})
			.catch(error => {
				console.log(`Ошибка загрузки раздела: ${error.message}`);
			});
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
	layoutBodyElem.classList.toggle('shifted'); 
	sidebarElem.classList.toggle('opened'); 
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

	page.render( menuLinkElem.getAttribute('href') );

	activeMenuLinkElem.classList.remove('current');
	menuLinkElem.classList.add('current');
}); 


page.render('visits');















