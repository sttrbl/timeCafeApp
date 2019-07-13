
const sidebarToggleBtn = document.querySelector('.btn-sidebar-toggle');
const navMenu = document.querySelector('.menu');
const page = new Page(document.querySelector('.page'));

sidebarToggleBtn.addEventListener('click', function (e) {
	const layoutBody = document.querySelector('.layout__body');
	layoutBody.classList.toggle('shifted'); 
	const sidebar = document.querySelector('.layout__sidebar');
	sidebar.classList.toggle('opened'); 
});

navMenu.addEventListener('click', function(e) {
	e = e || event;
	const menuLink = e.target.closest('.menu__link');

	if (menuLink.matches('.current')) {
		return e.preventDefault();
	}

	switch (menuLink.getAttribute('href')) {
		case '/visits':
			
			visitsPage.getShiftInfo().then(result => {
				page.renderContent( visitsPage.getElem(result), 'Посещения' );
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

	const current = e.currentTarget.querySelector('.current');
	current.classList.remove('current');
	menuLink.classList.add('current');

	e.preventDefault();
}); 

visitsPage.getShiftInfo().then(result => {
	page.renderContent( visitsPage.getElem(result), 'Посещения' );
});


//**************Объект страницы***************
function Page(rootElem) {
	const headlineElem = rootElem.querySelector('.page__headline');

	function setHeadline(value) {
		headlineElem.textContent = value;
		document.title = value;
	}

	function removeContent() {
		const pageContent = rootElem.querySelector('.page__content');
		if (pageContent) {
			pageContent.remove();
		}
	}

	function renderContent(content, pageHeadline) {
		removeContent();
		setHeadline(pageHeadline);
		rootElem.appendChild(content); 
	}

	this.renderContent = renderContent;
}









