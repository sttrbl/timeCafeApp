
//*********Модуль для рендера раздела "Посещения"**********//

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


function createVisitsPanel(options) {
	const elem = helper.create('div', 'visits-panel'); 
	const visitsList = helper.create('ul', 'visits-list');

	visitsList.setAttribute('shift-id', options.shiftId);


	visitsList.addEventListener('click', e => {

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


	visitsList.addEventListener('change', e => {

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


	const addVisitButton = helper.create('button', 'btn btn-add-visit', 'Добавить +');

	addVisitButton.addEventListener('click', () => {
		const visits = visitsList.querySelectorAll('.visit');
		visitsList.appendChild( createVisit(visits.length + 1, options.discountsValues) );
	});


	if (options.visits) {
		for (let i = 0; i < options.visits.length; i++) {
			visitsList.appendChild( createVisit(i + 1, options.discountsValues, options.visits[i]) );
		}
	}
  		

	elem.append(visitsList, addVisitButton);
	return elem;
}



function createVisit(visitNum, discountsValues, visitInfo) {
	const visitItemsNames = [['№','num'], ['Номерок :','person-tag'], 
							 ['Комментарий :','comment'], ['Начало :','start-time'], 
							 ['Окончание :','end-time'], ['Скидка :','discount'], ['Итого :','total']];

	const visitContainer = helper.create('li', 'visits-list__item ');

	const visitElem = document.createElement('ul');
	let visitStatus = 'new';

	if (visitInfo) {
		visitStatus = visitInfo['status'];
		visitContainer.setAttribute('real-id', visitInfo['id'])
		visitContainer.classList.add(visitInfo['status']);
	}

	visitContainer.classList.add(visitStatus);
	visitElem.className = 'visit';
	visitContainer.appendChild(visitElem);

	for (let i = 0; i < visitItemsNames.length + 2; i++) {
		const item = document.createElement('li');
		item.className = 'visit-info-item';

		if (i < visitItemsNames.length) {
			const itemHeadline = document.createElement('h5');
			itemHeadline.textContent = visitItemsNames[i][0];
			let itemValue;

			if (visitStatus != 'completed' && visitItemsNames[i][1] == 'discount' ) {

				itemValue = document.createElement('select');
				itemValue.appendChild(new Option('', 0));

				for (let i = 0; i < discountsValues.length; i++) {
					itemValue.appendChild(new Option(discountsValues[i]['id'], discountsValues[i]['value']));
				}

			} else if (visitItemsNames[i][1] == 'num') {
				itemValue = document.createElement('span');
				itemValue.textContent = visitNum;
			} else if (visitStatus == 'new') {

				switch (visitItemsNames[i][1]) {
					case 'person-tag':
						itemValue = document.createElement('input');
						itemValue.type = 'number';
						break;
					case 'comment':
						itemValue = document.createElement('input');
						itemValue.type = 'text';
						itemValue.setAttribute('maxlength', 40);
						break;
					default:
						itemValue = document.createElement('span');
						break;
				}

			} else {
				itemValue = document.createElement('span');
				itemValue.textContent = visitInfo[visitItemsNames[i][1].replace('-','_')];
			}

			itemValue.classList.add('visit__' + visitItemsNames[i][1]);

			if (itemValue.matches('visit__total') || visitStatus == 'calculated') {

				itemValue.setAttribute('pure-total', visitInfo['total']);
			}

			item.append(itemHeadline,itemValue);
		} else {
			const button = document.createElement('button');

			switch (i) {
				case visitItemsNames.length:
					button.className = 'btn btn-visit-controller';
					break;
				case visitItemsNames.length + 1:
					button.className = 'btn-remove-visit';
					button.innerHTML = '<i class="far fa-trash-alt"></i>';
					break;
				default:
					break;
			}

			item.appendChild(button);
		}

		visitElem.appendChild(item);
	}

	return visitContainer;
}



	//**************Вспомогательные функции и функции для работы с сервером ***************//

	

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


	function getDiscountsValues() {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/visitsPage.php",
			    data: {action:'getDiscountsValues'},
			    success: resp => {
			    	resp = JSON.parse(resp);
			    	if (resp.error) return helper.showError(resp.error);
           			resolve(resp);
		        },
		        error: () => {
	     			helper.showError("Ошибка соединения с сервером!")
	        	}
			});
		});
	}


	function removeVisit(node) {
		if (!confirm('Удалить посещение?')) return false;

		const visitId = node.getAttribute('real-id');
		const data = {id:visitId};

		$.ajax({
		    type: "POST",
		    url: "php/visitsPage.php",
		    data: {action:'removeVisit', data:data},
		    success: resp => {
		    	const visitsList = node.parentElement;
				node.remove();
				updateNums(visitsList);
	        },
	        error: () => {
     			helper.showError("Ошибка соединения с сервером!")
        	}
		});


		function updateNums(visitsList) {
			const numElems = visitsList.querySelectorAll('.visit__num');
			for (let i = 0; i < numElems.length; i++) {
				numElems[i].textContent = i + 1;
			}
		}
	}


	function startVisit(node) {
		const inputsList = node.querySelectorAll('input');
		let data = {};

		for (let i = 0; i < inputsList.length; i++) {
			const input = inputsList[i];
			if ( !validateInput(input) ) return false;
			const key = input.className.replace('-','_').replace('visit__','');
			data[key] = input.value; 
		}

		$.ajax({
		    type: "POST",
		    url: "php/visitsPage.php",
		    data: {action:'startNewVisit', visitInfo:data},
		    success: resp => {
		    	resp = JSON.parse(resp);
		    	if (resp.error) return alert(resp.error);
		    	node.classList.remove('new');
				node.classList.add('active');
				node.setAttribute('real-id', resp.visitId);
				node.querySelector('.visit__start-time').textContent = resp.startTime;

				const tagElem = node.querySelector('.visit__person-tag');
				const newTagElem = helper.create('span',tagElem.className, tagElem.value);
				tagElem.parentElement.replaceChild(newTagElem, tagElem);
	        },
	        error: () => {
     			helper.showError("Ошибка соединения с сервером!")
        	}
		});

		function validateInput(inputElem) {
			//Дописать
			if ( !inputElem.matches('.visit__comment') && inputElem.value.trim() == '') {
				alert('Заполните все обязательные поля.'); 
				return false;
			}
			return true;
		}

	}



	function calculateVisit(node) {
		let data = {};
		data.visitId = node.getAttribute('real-id');

		$.ajax({
		    type: "POST",
		    url: "php/visitsPage.php",
		    data: {action:'calculateVisit', data:data},
		    success: resp => {
		    	resp = JSON.parse(resp);
		    	if (resp.error) return alert(resp.error);

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
		let data = {};
		data.visitId = node.getAttribute('real-id');
		data.finalTotal = node.querySelector('.visit__total').textContent;

		const discountSelect = node.querySelector('.visit__discount');
		const selectedElem = discountSelect.querySelector('[value ="'+ discountSelect.value +'"]')
		data.discount = selectedElem.textContent;
	
		$.ajax({
		    type: "POST",
		    url: "php/visitsPage.php",
		    data: {action:'endVisit', data:data},
		    success: resp => {
		    	resp = JSON.parse(resp);
		    	

		    	node.classList.remove('calculated');
				node.classList.add('completed');

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