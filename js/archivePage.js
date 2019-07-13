const archivePage = (function () {

	function createArchivePage(period) {
		const content = helper.create('section', 'page__content');
		content.appendChild( createOutpusController(period) );
		return content;
	}


	function createOutpusController(period) {
		const elem = helper.create('form', 'output-controll');
		const fromContainer = helper.create('div', 'output-controll__date');
		const toContainer = helper.create('div', 'output-controll__date');
		const sendButton = helper.create('button', 'btn btn-apply-dates', 'Вывести');
		const fromLabel = helper.create('label','output-controll__label', 'От :');
		const toLabel = helper.create('label','output-controll__label', 'До :');
		const fromInput = document.createElement('input');
		const toInput = document.createElement('input');

		fromInput.type = 'date';
		toInput.type = 'date';

		fromInput.min = period.from;
		fromInput.max = period.to;
		toInput.min = period.from;
		toInput.max = period.to;
		fromInput.setAttribute('required', true);
		toInput.setAttribute('required', true);


		elem.addEventListener('submit', function(e) {
			getPeriodInfo(fromInput.value, toInput.value).then(result => {
				let statisticsElement = elem.parentElement.querySelector('.period-statistics');
				let shiftsElement = elem.parentElement.querySelector('.period-shifts');

				if (statisticsElement) {
					elem.parentElement.replaceChild( createStatistics(result.statistics), statisticsElement);
					elem.parentElement.replaceChild( createPeriodShifts(result.shifts), shiftsElement);
					return;
				}
				elem.parentElement.append( createStatistics(result.statistics), createPeriodShifts(result.shifts) );
			});

			e.preventDefault();
		});

		fromContainer.append(fromLabel, fromInput);
		toContainer.append(toLabel, toInput);
		elem.append(fromContainer, toContainer, sendButton);
		return elem;
	}

	function createStatistics(statistics) {
		const itemsNames = [
			['total_shifts', 'Всего смен : ', ''],
			['total_visitors', 'Всего посетителей : ' , 'чел.'],
			['average_check', 'Средний чек : ', 'руб.'],
			['average_profit', 'Средняя прибыль за смену : ', 'руб.'],
			['average_duration','Средняя длит. посещения : ', 'мин.'],
			['total_profit', 'Общая прибыль : ', 'руб.']
		];

		const elem = helper.create('ul', 'period-statistics');

		for (let i = 0; i < itemsNames.length; i++) {
			const item = helper.create('li', 'period-statistics__item');
			const itemLabel = helper.create('span', 'item__label',  itemsNames[i][1]);
			const itemValue = helper.create('span', 'item__value');
			itemValue.textContent = statistics[ itemsNames[i][0] ] + ' ' + itemsNames[i][2];
			item.append(itemLabel, itemValue);

			elem.appendChild(item);
		}

		return elem;
	}

	function createPeriodShifts(shifts) {
		const elem = helper.create('ul', 'period-shifts');

		for (let i = 0; i < shifts.length; i++) {
			const item = helper.create('li', 'period-shifts__item shift');
			const shiftDate =  parseShiftDate(shifts[i].date);
			const itemDay = helper.create('h1', 'shift__day', shiftDate.day );
			let itemMonth = helper.create('h2', 'shift__month', shiftDate.month);

			let itemTime =  shifts[i].start_time + ' - ' + shifts[i].end_time;
			itemTime = helper.create('span', 'shift__time', itemTime);

			item.id = shifts[i].id;
			item.setAttribute('date', shifts[i].date);

			item.append(itemDay, itemMonth, itemTime);
			elem.appendChild(item);
		}


		elem.addEventListener('click', function(e) {
			if (!e.target.closest('.shift')) return false;

			const target = e.target.closest('.shift');
			const pageContent = document.querySelector('.page__content');

			for (var i = 0; i < pageContent.children.length; i++) {
				pageContent.children[i].style = 'display:none;';
			}

			getShiftVisits(target.id).then(result => {
				const shiftDate = {
					date: target.getAttribute('date'),
					period: target.querySelector('.shift__time').textContent
				};

				pageContent.appendChild( createShiftOutput(result, shiftDate) );
			});

		});

		return elem;
	}


	function createShiftOutput(visits, date) {
		const elem = document.createDocumentFragment();
		const shiftHeader = helper.create('header', 'shift-header');
		const shiftHeadline = helper.create('h4', 'shift-headline', 'Обзор смены за ' 
											+ date.date + ' (' +  date.period + ')');
		const backButton = helper.create('button', 'btn-return', 'Назад');
		shiftHeader.append(backButton, shiftHeadline);

		const shiftVisitsList = helper.create('ul', 'shift-visits');

		for (let i = 0; i < visits.length; i++) {
			shiftVisitsList.appendChild( createVisitRow(visits[i], i+1) ); 
		}


		backButton.addEventListener('click', function(e) {
			shiftHeader.remove();
			shiftVisitsList.remove();

			const pageContent = document.querySelector('.page__content');

			for (var i = 0; i < pageContent.children.length; i++) {
				pageContent.children[i].style = '';
			}
		});

		elem.append(shiftHeader, shiftVisitsList);
		return elem;
	}


	function createVisitRow(visit, num) {
		const itemsNames = [
			['num','№'],
			['comment','Комментарий :'],
			['start_time','Начало :'],
			['end_time','Конец :'],
			['discount','Скидка :'], 
			['total','Итого :'], 
			['status','Статус :'], 
			['end_user','Завершил :'] 
		];

		const elem = helper.create('li','shift-visits__item visit');

		for (var i = 0; i < itemsNames.length; i++) {
			const item = helper.create('div', 'visit__item');
			const itemLabel = helper.create('label', 'visit__item__label', itemsNames[i][1]);
			const itemValue = helper.create('span', 'visit__item__value');
			item.append(itemLabel, itemValue);
			elem.appendChild(item);

			if (i == 0) {
				itemValue.textContent = num; 
				continue;
			}

			itemValue.textContent = visit[ itemsNames[i][0] ] ;
		}
		
		return elem;
	}


	//*****************Сервер*****************//

	function parseShiftDate(string) {
		const shiftDate =  new Date(string);
		const dateElems = {};
		dateElems.day = shiftDate.getDate();
		dateElems.month = shiftDate.toLocaleString('ru-RU', {month: 'long'});
		dateElems.month = dateElems.month[0].toUpperCase() + dateElems.month.slice(1);
		return dateElems;
	}

	function getDatePeriod() {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/archivePage.php",
			    data: {action:'getDatePeriod'},
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

	function getPeriodInfo(from, to) {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/archivePage.php",
			    data: {action:'getPeriodInfo',from:from,to:to},
			    success: function(resp) {
			    	resp = JSON.parse(resp);
					if (resp.error) return alert(resp.error);

					console.log(resp);
					console.log( parseShiftDate('"2019-05-04"') );
	       			resolve(resp);
		        },
		        error: function() {
		        	reject()
		        }
			});
		});
	}


	function getShiftVisits(shiftId) {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/archivePage.php",
			    data: {action:'getShiftVisits', shiftId:shiftId},
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

	return {
		getElem: createArchivePage,
		getDatePeriod: getDatePeriod
	}
})(); 