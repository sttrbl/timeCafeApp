
//********* Модуль для подготовки компонентов раздела "Посещения" **********//

const visitsPage = ( () => {


function createVisitsPage(shiftInfo) {

	const content = helper.create('section', 'page__content');

	content.appendChild( createDayPanel( !!shiftInfo ) );

	if (shiftInfo) content.appendChild( createVisitsPanel(shiftInfo) );

	return content;
}


//Аргумент - true/false
function createDayPanel(active) {

	function formatDate(date) {
		return date.toLocaleString('ru-RU', { month: 'long', day: 'numeric'}) + ', ' +
			   date.toLocaleString('ru-RU', { weekday: 'long'})[0].toUpperCase() +
			   date.toLocaleString('ru-RU', { weekday: 'long'}).slice(1);
	}

	const elem = helper.create('div', 'today-info clearfix'); 
	const dateElem = helper.create('h4', 'today-info__date', formatDate( new Date() )); 
	const shiftContollButton = helper.create('button', 'btn btn-day-controller'); 

	if (active) {
		shiftContollButton.classList.add('active');
	}


	shiftContollButton.addEventListener('click', e => {
		const self = e.currentTarget;

		if ( !self.matches('.active') ) {

			if ( !confirm('Начать смену?') ) return;

			startShift().then(result => {
		  		self.closest('.page__content').appendChild( createVisitsPanel(result) );
		  		self.classList.toggle('active');	
			});

		} else {

			if ( !confirm('Завершить смену?') ) return;

			const visitsListElem = self.closest('.page__content').querySelector('.visits-list');

			endShift( visitsListElem.getAttribute('shift-id') ).then(result => {
				const visitsPanelElem = self.closest('.page__content').querySelector('.visits-panel');
			  	visitsPanelElem.remove();
				self.classList.toggle('active');		
			});
		}
	});

	elem.append(dateElem, shiftContollButton);
	return elem;
}


function createVisitsPanel({shiftId, visits: visitsList, discountsValues: discountsValuesList }) {

	const elem = helper.create('div', 'visits-panel'); 
	const visitsListElem = helper.create('ul', 'visits-list');

	visitsListElem.setAttribute('shift-id', shiftId);


	//Описание функциональности кнопок в блоках посещений через делегирование
	visitsListElem.addEventListener('click', e => {

		const button = e.target.closest('button');
		const visitRootElem = e.target.closest('.visits-list__item');

		if (!button) return;


		if ( button.matches('.btn-remove-visit') ) {

			removeVisit(visitRootElem);

		} else if ( button.matches('.btn-visit-controller') ) {

			const visitStatus = visitRootElem.classList[1];
			
			switch (visitStatus) {
				case 'new':
					startVisit(visitRootElem);
					break;
				case 'active':
					calculateVisit(visitRootElem);
					break;
				case 'calculated':
					endVisit(visitRootElem);
					break;
			}
		}
	});


	//Обработчик изменения значения скидки в блоке (через делегирование)
	visitsListElem.addEventListener('change', e => {

		if ( !e.target.closest('.visit__discount') ) return;

		const discountElem = e.target;
		const visitElem = discountElem.closest('.visit');
		const totalElem = visitElem.querySelector('.visit__total');
		
		if ( !totalElem.hasAttribute('pure-total') ) return;

		const discountValue = +discountElem.value;
		let totalValue = +totalElem.getAttribute('pure-total');

		if (discountValue != 0) {
			totalValue = Math.round( totalValue - ( (totalValue / 100) * discountValue) ) ;
		}

		totalElem.textContent = totalValue;
	});


	const addButtonElem = helper.create('button', 'btn btn-add-visit', 'Добавить');

	addButtonElem.addEventListener('click', () => {
		const visitsElems = visitsListElem.querySelectorAll('.visit');
		const lastVisitNum = visitsElems.length + 1;
		visitsListElem.appendChild( createVisit(lastVisitNum, discountsValuesList) );
	});


	//visitsList - массив с информацией (из БД) о посещениях за текущую смену
	if (visitsList) {

		for (let i = 0; i < visitsList.length; i++) {
			visitsListElem.appendChild( createVisit(i + 1, discountsValuesList, visitsList[i]) );
		}

	}
  		

	elem.append(visitsListElem, addButtonElem);
	return elem;
}



function createVisit(visitNum, discountsValues, visitInfo) {
	const visitItemsNames = [['№','num'], ['Номерок :','person-tag'], 
							 ['Комментарий :','comment'], ['Начало :','start-time'], 
							 ['Окончание :','end-time'], ['Скидка :','discount'], ['Итого :','total']];

	let visitStatus = 'new';
	const visitContainer = helper.create('li', 'visits-list__item ');
	const visitElem = helper.create('ul', 'visit');
	
	if (visitInfo) {
		visitStatus = visitInfo.status;
		visitContainer.setAttribute('real-id', visitInfo.id);
	}

	visitContainer.classList.add(visitStatus);
	visitContainer.appendChild(visitElem);

	for (let i = 0; i < visitItemsNames.length + 2; i++) { 
		const item = helper.create('li', 'visit-info-item');
		visitElem.appendChild(item);
	}


	visitItemsNames.forEach( (itemName, i) => {

		const itemHeadline = helper.create('h5', null, itemName[0]);
		let itemContent;

		if (visitStatus != 'completed' && itemName[1] == 'discount') {
			itemContent = document.createElement('select');

			itemContent.appendChild( new Option('', 0)) ;

			for (let i = 0; i < discountsValues.length; i++) {
				itemContent.appendChild(new Option(discountsValues[i]['id'], discountsValues[i]['value']));
			}

		} else if (visitStatus == 'new' && i > 0) {

			switch (itemName[1]) {
				case 'person-tag':
					itemContent = document.createElement('input');
					itemContent.type = 'number';
					break;
				case 'comment':
					itemContent = document.createElement('input');
					itemContent.type = 'text';
					itemContent.setAttribute('maxlength', 40);
					break;
				default:
					itemContent = document.createElement('span');
					break;
			}

		} else {
			itemContent = document.createElement('span');
			const itemNameOnServer = itemName[1].replace('-','_');
			itemContent.textContent = (i > 0) ? visitInfo[itemNameOnServer] : visitNum;
		}

		itemContent.classList.add('visit__' + itemName[1]);
	
		visitElem.children[i].append(itemHeadline, itemContent);
	});

	const controllButton = helper.create('button', 'btn btn-visit-controller');
	const removeButton = helper.create('button', 'btn-remove-visit');

	removeButton.innerHTML = '<i class="far fa-trash-alt"></i>';
	visitElem.children[visitItemsNames.length].append(controllButton);
	visitElem.lastElementChild.append(removeButton);

	return visitContainer;
}



//************** Функции для работы с сервером ***************//

	function getShiftInfo() {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/visitsPage.php",
			    data: {action:'getShiftInfo'},
			    success: resp => {
			    	try {
			    		resp = JSON.parse(resp);
			    		if (resp.error) return helper.showError(resp.error);
           				resolve(resp);
			    	} catch(e) {
			    		helper.showError("Ошибка чтения данных!");
			    		throw e;
			    	}
			    	
		        },
		        error: () => {
	     			helper.showError("Ошибка соединения с сервером!");
	        	}
			});
		});
	}


	function startShift() {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/visitsPage.php",
			    data: {action:'startShift'},
			    success: resp => {
			    	try {
			    		resp = JSON.parse(resp);
			    		if (resp.error) return helper.showError(resp.error);
			    		resolve(resp);
			    	}
           			catch(e) {
			    		helper.showError(`Ошибка чтения данных : ${e.name}`);
			    		throw e;
			    	}
		        },
		        error: () => {
	     			helper.showError("Ошибка соединения с сервером!")
	        	}
			});
		});
	}


	function endShift(id) {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/visitsPage.php",
			    data: {action:'endShift', shiftId:id},
			    success: resp => {
			    	try {
			    		resp = JSON.parse(resp);
			    		if (resp.error) return helper.showError(resp.error);
			    		resolve(resp);
			    	}
           			catch(e) {
			    		helper.showError(`Ошибка чтения данных : ${e.name}`);
			    		throw e;
			    	}
		        },
		        error: () => {
	     			helper.showError("Ошибка соединения с сервером!")
	        	}

			});
		});
	}


	function removeVisit(node) {
		if (!confirm('Удалить посещение?')) return false;

		const data = {
			id : node.getAttribute('real-id')
		};

		$.ajax({
		    type: "POST",
		    url: "php/visitsPage.php",
		    data: {action:'removeVisit', data:data},
		    success: resp => {
				try {
		    		resp = JSON.parse(resp);
		    		
		    		if (resp.error) return helper.showError(resp.error);
		  
			    	const visitsList = node.parentElement;
					node.remove();

					visitsList.querySelectorAll('.visit__num').forEach((numElem, i) => {
						numElem.textContent = i + 1;
					});
								
			    }
       			catch(e) {
		    		helper.showError(`Ошибка чтения данных : ${e.name}`);
		    		throw e;
		    	}
	        },
	        error: () => {
     			helper.showError("Ошибка соединения с сервером!")
        	}
		});
	}


	function startVisit(node) {

		function validateInput(inputElem) {
			//Дописать
			if ( !inputElem.matches('.visit__comment') && inputElem.value.trim() == '') {
				return false;
			}
			return true;
		}

		let data = {};

		node.querySelectorAll('input').forEach((inputElem) => {
			
			if ( !validateInput(inputElem) ) return helper.showError('Заполните все обязательные поля.'); 

			const key = inputElem.className.replace('-','_').replace('visit__','');
			data[key] = inputElem.value; 
		});
		

		$.ajax({
		    type: "POST",
		    url: "php/visitsPage.php",
		    data: {action:'startNewVisit', visitInfo:data},
		    success: resp => {
		    	try {
		    		resp = JSON.parse(resp);
		    		
		    		if (resp.error) return helper.showError(resp.error);			
			    }
       			catch(e) {
		    		helper.showError(`Ошибка чтения данных : ${e.name}`);
		    		throw e;
		    	}
		    	
		    	node.classList.remove('new');
				node.classList.add('active');
				node.setAttribute('real-id', resp.visitId);
				node.querySelector('.visit__start-time').textContent = resp.startTime;

				const tagElem = node.querySelector('.visit__person-tag');
				const newTagElem = helper.create('span',tagElem.className, tagElem.value);
				tagElem.parentElement.replaceChild(newTagElem, tagElem);

				//(ДОПИСАТЬ!): решить, что делать с комментарием к посещению
		    	
	        },
	        error: () => {
     			helper.showError("Ошибка соединения с сервером!")
        	}
		});

	}


	function calculateVisit(node) {
		let data = {
			visitId: node.getAttribute('real-id')
		};

		$.ajax({
		    type: "POST",
		    url: "php/visitsPage.php",
		    data: {action:'calculateVisit', data:data},
		    success: resp => {

		    	try {
		    		resp = JSON.parse(resp);
		    		
		    		if (resp.error) return helper.showError(resp.error);			
			    }
       			catch(e) {
		    		helper.showError(`Ошибка чтения данных : ${e.name}`);
		    		throw e;
		    	}

		    	const endTimeElem = node.querySelector('.visit__end-time');
		 		const totalElem = node.querySelector('.visit__total');
		 		const discountValue = node.querySelector('.visit__discount').value;

		 		endTimeElem.textContent = resp.endTime;

		 		totalElem.setAttribute('pure-total', resp.pureTotal);

		 		if (discountValue != 0) {
		 			totalElem.textContent = resp.pureTotal - (resp.pureTotal / 100 * discountValue);
		 		} else {
		 			totalElem.textContent = resp.pureTotal;
		 		}

		    	node.classList.remove('active');
				node.classList.add('calculated');
	        },
	        error: () => {
     			helper.showError("Ошибка соединения с сервером!")
        	}
		});	
	}

	function endVisit(node) {
		let data = {
			visitId: node.getAttribute('real-id'),
			finalTotal: node.querySelector('.visit__total').textContent
		};

		const discountSelect = node.querySelector('.visit__discount');
		const selectedElem = discountSelect.querySelector('[value ="'+ discountSelect.value +'"]')
		data.discount = selectedElem.textContent;
	
		$.ajax({
		    type: "POST",
		    url: "php/visitsPage.php",
		    data: {action:'endVisit', data:data},
		    success: resp => {

		    	try {
		    		resp = JSON.parse(resp);
		    		
		    		if (resp.error) return helper.showError(resp.error);			
			    }
       			catch(e) {
		    		helper.showError(`Ошибка чтения данных : ${e.name}`);
		    		throw e;
		    	}

				const commentElem = node.querySelector('.visit__comment');
				const newCommentElem = helper.create('span', commentElem.className, commentElem.value);
				commentElem.parentElement.replaceChild(newCommentElem, commentElem);

				const discountElem = node.querySelector('.visit__discount');
				const newDiscountElem = helper.create('span', discountElem.className, data.discount);
				discountElem.parentElement.replaceChild(newDiscountElem, discountElem);

				node.classList.remove('calculated');
				node.classList.add('completed');
	        },
	        error: () => {
     			helper.showError("Ошибка соединения с сервером!")
        	}
		});
	}


	return {
		getContent: createVisitsPage,
		getShiftInfo: getShiftInfo
	}
})();