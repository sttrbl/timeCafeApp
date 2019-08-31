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

const navMenu = document.querySelector('.menu');
const layoutBody = document.querySelector('.layout__body');
const sidebar = document.querySelector('.layout__sidebar');
const sidebarToggleBtn = document.querySelector('.btn-sidebar-toggle');
const alert = document.querySelector('.alert');
const page = new Page( document.querySelector('.page') );

alert.style.width = `${layoutBody.offsetWidth}px`;


window.addEventListener(`resize`, e => {
	alert.style.width = `${layoutBody.offsetWidth}px`;
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
	layoutBody.classList.toggle('shifted'); 
	sidebar.classList.toggle('opened'); 
});


layoutBody.addEventListener('click', e => {
	if ( sidebar.matches('.opened') && !e.target.closest('.mobile-header') ) {
		toggleSidebar();
	}
});


navMenu.addEventListener('click', e => {
	e.preventDefault();
	
	const menuLinkElem = e.target.closest('.menu__link');
	const activeMenuLinkElem = e.currentTarget.querySelector('.current');

	if ( !menuLinkElem || (menuLinkElem == activeMenuLinkElem) ) return;

	if ( sidebar.matches('.opened') ) toggleSidebar();

	page.render( menuLinkElem.getAttribute('href') );

	activeMenuLinkElem.classList.remove('current');
	menuLinkElem.classList.add('current');
}); 


page.render('visits');















