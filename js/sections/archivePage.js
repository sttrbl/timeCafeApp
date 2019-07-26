//********* Модуль для подготовки компонентов раздела "Архив" **********//

const archivePage = (() => {

	function createArchivePage(period) {
		const content = helper.create('section', 'page__content');

		content.appendChild(createOutputController(period));

		return content;
	}


	function createOutputController(period) {
		const elem = helper.create('form', 'output-controll');
		const fromContainer = helper.create('div', 'output-controll__date');
		const toContainer = helper.create('div', 'output-controll__date');
		const sendButton = helper.create('button', 'btn btn-apply-dates', 'Вывести');
		const fromLabel = helper.create('label', 'output-controll__label', 'От :');
		const toLabel = helper.create('label', 'output-controll__label', 'До :');
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


		elem.addEventListener('submit', e => {

			getPeriodInfo(fromInput.value, toInput.value).then(({
				statistics,
				shifts
			}) => {
				let statisticsElement = elem.parentElement.querySelector('.period-statistics');
				let shiftsElement = elem.parentElement.querySelector('.period-shifts');

				if (statisticsElement) {
					elem.parentElement.replaceChild(createStatistics(statistics), statisticsElement);
					elem.parentElement.replaceChild(createPeriodShifts(shifts), shiftsElement);
					return;
				}

				elem.parentElement.append(createStatistics(statistics), createPeriodShifts(shifts));
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
			['total_visitors', 'Всего посетителей : ', 'чел.'],
			['average_check', 'Средний чек : ', 'руб.'],
			['average_profit', 'Средняя выручка за смену : ', 'руб.'],
			['average_duration', 'Средняя длит. посещения : ', 'мин.'],
			['total_profit', 'Общая выручка : ', 'руб.']
		];

		const elem = helper.create('ul', 'period-statistics');

		itemsNames.forEach((itemName, i) => {
			const item = helper.create('li', 'period-statistics__item');
			const itemLabel = helper.create('span', 'item__label', itemName[1]);
			const itemValue = helper.create('span', 'item__value');

			itemValue.textContent = `${statistics[ itemName[0] ]} ${itemName[2]}`;

			item.append(itemLabel, itemValue);
			elem.appendChild(item);
		});

		return elem;
	}


	function createPeriodShifts(shifts) {
		const elem = helper.create('ul', 'period-shifts');

		shifts.forEach(({
			id,
			date,
			start_time: start,
			end_time: end
		}, i) => {
			const item = helper.create('li', 'period-shifts__item shift');
			const shiftDate = parseShiftDate(date);
			const itemDay = helper.create('h1', 'shift__day', shiftDate.day);
			let itemMonth = helper.create('h2', 'shift__month', shiftDate.month);
			let itemTime = helper.create('span', 'shift__time', `${start} - ${end}`);

			item.id = id;
			item.setAttribute('date', date);

			item.append(itemDay, itemMonth, itemTime);
			elem.appendChild(item);
		});

		elem.addEventListener('click', e => {
			const shiftElem = e.target.closest('.shift');

			if (!shiftElem) return false;

			const pageContent = document.querySelector('.page__content');
			const pageElements = Array.prototype.slice.call(pageContent.children);

			pageElements.forEach((element, i) => {
				element.style = "display: none";
			});

			getShiftVisits(shiftElem.id).then(result => {
				const shiftDate = {
					date: shiftElem.getAttribute('date'),
					period: shiftElem.querySelector('.shift__time').textContent
				};

				pageContent.appendChild(createShiftOutput(result, shiftDate));
			});

		});

		return elem;
	}


	function createShiftOutput(visits, date) {
		const elem = document.createDocumentFragment();
		const shiftHeader = helper.create('header', 'shift-header');
		const shifHeadlineText = `Смена ${date.date} ( ${date.period} )`;
		const shiftHeadline = helper.create('h4', 'shift-headline', shifHeadlineText);
		const backButton = helper.create('button', 'btn-return', 'Назад');
		const shiftVisitsList = helper.create('ul', 'shift-visits');

		visits.forEach((visit, i) => shiftVisitsList.appendChild(createVisitRow(visit, i + 1)));

		backButton.addEventListener('click', e => {
			const pageContent = document.querySelector('.page__content');
			const pageElements = Array.prototype.slice.call(pageContent.children);

			shiftHeader.remove();
			shiftVisitsList.remove();

			pageElements.forEach((element, i) => {
				element.style = '';
			});
		});

		shiftHeader.append(backButton, shiftHeadline);
		elem.append(shiftHeader, shiftVisitsList);

		return elem;
	}


	function createVisitRow(visit, num) {
		const itemsNames = [
			['num', '№'],
			['comment', 'Комментарий :'],
			['start_time', 'Начало :'],
			['end_time', 'Конец :'],
			['discount', 'Скидка :'],
			['total', 'Итого :'],
			['status', 'Статус :'],
			['end_user', 'Завершил :']
		];

		const elem = helper.create('li', 'shift-visits__item visit');

		itemsNames.forEach((name, i) => {
			const item = helper.create('div', 'visit__item');
			const itemLabel = helper.create('label', 'visit__item__label', name[1]);
			const itemValue = helper.create('span', 'visit__item__value');

			itemValue.textContent = (i > 0) ? visit[name[0]] : num;

			item.append(itemLabel, itemValue);
			elem.appendChild(item);
		});

		return elem;
	}


	function parseShiftDate(string) {
		const shiftDate = new Date(string);
		const dateElems = {};

		dateElems.day = shiftDate.getDate();
		dateElems.month = shiftDate.toLocaleString('ru-RU', {
			month: 'long'
		});
		dateElems.month = dateElems.month[0].toUpperCase() + dateElems.month.slice(1);

		return dateElems;
	}



	//********************Сервер ********************//

	function getDatePeriod() {
		return new Promise(resolve => {
			helper.request('php/sections/archivePage.php', {
				action: 'getDatePeriod'
			}).then(resp => {
				resolve(resp);
			});
		});
	}

	function getPeriodInfo(from, to) {
		const data = {
			action: 'getPeriodInfo',
			from,
			to
		};

		return new Promise(resolve => {
			helper.request('php/sections/archivePage.php', data).then(resp => {
				resolve(resp);
			});
		});
	}


	function getShiftVisits(shiftId) {
		const data = {
			action: 'getShiftVisits',
			shiftId
		};

		return new Promise(resolve => {
			helper.request('php/sections/archivePage.php', data).then(resp => {
				resolve(resp);
			});
		});
	}

	return {
		getElem: createArchivePage,
		getDatePeriod: getDatePeriod
	};
})();