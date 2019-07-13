//**************Создание контента***************//
const visitsPage = (function () {

function createVisitsPage(shiftInfo) {
	const content = document.createElement('section');
	content.className = 'page__content';

	if (shiftInfo) {
		content.appendChild( createDayPanel(true) );
		content.appendChild( createVisitsPanel(shiftInfo) );
	} else {
		content.appendChild( createDayPanel() );
	}

	return content;
}


function createDayPanel(active) {
	const elem = document.createElement('div');
	const dateElem = document.createElement('h4');
	const button = document.createElement('button');

	elem.className = 'today-info clearfix';
	dateElem.className = 'today-info__date';
	button.className = 'btn btn-day-controller';

	if (active) {
		button.classList.add('active');
	}

	dateElem.textContent = formatDate(new Date());

	button.addEventListener('click', function(e) {
		const self = this;

		if (!self.matches('.active')) {
			if (!confirm('Начать смену?')) return;
			startShift().then(result => {
				if (result.error) {
					alert(result.error);
					return;
				}
		  		self.closest('.page__content').appendChild( createVisitsPanel(result) );
		  		self.classList.toggle('active');	
			});

		} else {
			if (!confirm('Завершить смену?')) return;
			const visitsListElem = self.closest('.page__content').querySelector('.visits-list');
			endShift( visitsListElem.getAttribute('shift-id') ).then(result => {
				if (result.error) {
					alert(result.error);
					return;
				}
			  	this.closest('.page__content').querySelector('.visits-panel').remove();
				this.classList.toggle('active');		
			});
		}
	});

	elem.append(dateElem, button);
	return elem;
}


function createVisitsPanel(options) {
	const elem = document.createElement('div');
	const visitsList = document.createElement('ul');
	
	elem.className = 'visits-panel';
	visitsList.className = 'visits-list';
	visitsList.setAttribute('shift-id', options.shiftId);

	visitsList.addEventListener('click', function(e) {
		e = e || event;

		const button = e.target.closest('button');

		if (!button) {
			return;
		}

		const visitRootElem = e.target.closest('.visits-list__item');

		if (button.matches('.btn-remove-visit')) {
			removeVisit(visitRootElem);
		}

		if (e.target.closest('.btn-visit-controller')) {
			const currentVisitStatus = visitRootElem.classList[visitRootElem.classList.length - 1];
			
			switch (currentVisitStatus) {
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

	visitsList.addEventListener('change', function(e) {
		e = e || event;
		if (!e.target.closest('.visit__discount')) return;
		const visitElem = e.target.closest('.visit');
		const totalElem = visitElem.querySelector('.visit__total');
		const discount = +e.target.value;

		if (!totalElem.hasAttribute('pure-total')) return;

		let total = +totalElem.getAttribute('pure-total');

		if (discount != 0) {
			total = Math.round( total - ((total / 100) * discount) ) ;
		}

		totalElem.textContent = total;
	});


	const addVisitButton = document.createElement('button');
	addVisitButton.className = 'btn btn-add-visit';
	addVisitButton.textContent = 'Добавить +';

	getDiscountsValues().then(discountsValues => {

		addVisitButton.addEventListener('click', function() {
			const visits = visitsList.querySelectorAll('.visit');
			visitsList.appendChild( createVisit(visits.length + 1, discountsValues) );
		});

		if (options.visits) {
			for (let i = 0; i < options.visits.length; i++) {
				visitsList.appendChild( createVisit(i + 1, discountsValues, options.visits[i]) );
			}
		}
  		
	});

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

	function formatDate(date) {
		return date.toLocaleString('ru-RU', { month: 'long', day: 'numeric'}) + ', ' +
			   date.toLocaleString('ru-RU', { weekday: 'long'})[0].toUpperCase() +
			   date.toLocaleString('ru-RU', { weekday: 'long'}).slice(1);
	}


	function getShiftInfo() {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/visitsPage.php",
			    data: {action:'getShiftInfo'},
			    success: function(resp) {
			    	resp = JSON.parse(resp);
			    	if (resp.error) return alert(resp.error);
           			resolve(resp);
		        },
		        error: function() {
		        	reject()
		        }
			});
		});
		return shiftInfo;
	}

	function getDiscountsValues() {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/visitsPage.php",
			    data: {action:'getDiscountsValues'},
			    success: function(resp) {
			    	resp = JSON.parse(resp);
			    	if (resp.error) return alert(resp.error);
           			resolve(resp);
		        },
		        error: function() {
		        	reject()
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
			    success: function(resp) {
           			resp = JSON.parse(resp);
           			resolve(resp);
		        },
		        error: function() {
		        	reject()
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
			    success: function(resp) {
			    	if (resp.error) {
			    		resolve(JSON.parse(resp));
			    		return;
			    	}
           			resolve(resp);
		        },
		        error: function() {
		        	reject()
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
		    success: function(resp) {
		    	const visitsList = node.parentElement;
				node.remove();
				updateNums(visitsList);
	        },
	        error: function() {
	     		alert('Серверная ошибка!')
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
		    success: function(resp) {
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
	        error: function() {
	     		alert('Серверная ошибка!')
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
		    success: function(resp) {
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
	        error: function() {
	     		alert('Серверная ошибка!')
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
		    success: function(resp) {
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
	        error: function() {
	     		alert('Серверная ошибка!')
	        }
		});

	}


	return {
		getElem: createVisitsPage,
		getShiftInfo: getShiftInfo
	}
})();