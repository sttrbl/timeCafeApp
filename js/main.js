//Класс для области отображения разделов
class Page {

	constructor(rootElem) {
		this._rootElem = rootElem;
		this._headlineElem = rootElem.querySelector('.page__headline');
	}

	setHeadline(value) {
		this._headlineElem.textContent = value;
		document.title = value;
	}

	removeContent() {
		const pageContent = this._rootElem.querySelector('.page__content');
		if (pageContent) pageContent.remove();
	}

	renderContent(content, pageHeadline) {
		this.removeContent();
		this.setHeadline(pageHeadline);
		this._rootElem.appendChild(content); 
	}

};


const sidebarToggleBtn = document.querySelector('.btn-sidebar-toggle');
const navMenu = document.querySelector('.menu');
const page = new Page( document.querySelector('.page') );

//Обработчик нажатия кнопки для тоггла меню на сайдбаре
sidebarToggleBtn.addEventListener('click', (e) => {
	const layoutBody = document.querySelector('.layout__body');
	const sidebar = document.querySelector('.layout__sidebar');
	layoutBody.classList.toggle('shifted'); 
	sidebar.classList.toggle('opened'); 
});


/* 
Обработчик рендерит контент выбранного раздела, когда
соответствующий модуль загрузит все данные с сервера
*/
navMenu.addEventListener('click', (e) => {
	const menuLink = e.target.closest('.menu__link');

	if ( menuLink.matches('.current') ) return e.preventDefault();


	switch ( menuLink.getAttribute('href') ) {

		case '/visits':
			visitsPage.getShiftInfo().then(result => {
				page.renderContent( visitsPage.getContent(result), 'Посещения' );
			});
			break;

		case '/archive':
			archivePage.getDatePeriod().then(result => {
				page.renderContent( archivePage.getElem(result), 'Архив' );
			});
			break;

		case '/settings':
				settingsPage.getSettings().then(result => {
					page.renderContent( settingsPage.getElem(result), 'Настройки' );
				});
			break;

	}


//Выбранный пункт превращается в "текущий"
	const current = e.currentTarget.querySelector('.current');
	current.classList.remove('current');
	menuLink.classList.add('current');

	e.preventDefault();
}); 



//Автоматический рендер раздела "Посещения" при загрузке приложения
visitsPage.getShiftInfo().then(result => {
	page.renderContent( visitsPage.getContent(result), 'Посещения' );
});















