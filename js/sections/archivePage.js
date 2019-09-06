//********* Модуль для подготовки компонентов раздела "Архив" **********//

const archivePageModule = (() => {

	async function getPageContent() {
		const pageContent = [];
		const datePeriod = await getDatePeriod();

		if (datePeriod === false) {
			throw new Error('Не удалось загрузить информацию о датах смен.')
		}

		pageContent.push(createOutputController(datePeriod));

		return pageContent;
	}


	function createOutputController({from: fromDate, to: toDate}) {
		const outputControllerForm = helper.create('form', 'output-controll');
		const sendBtn = helper.create('button', 'btn btn-apply-dates', 'Вывести');

		for (let i = 0; i < 2; i++) {
			const inputName = (i == 0) ? 'from' : 'to';
			const dateInputContainer = helper.create('div', 'output-controll__date');
			const labelElem = helper.create('label', 'output-controll__label', (inputName == 'from') ? 'От :' : 'До :');
			const dateInput = document.createElement('input');

			dateInput.type = 'date';
			dateInput.name = inputName;
			dateInput.min = fromDate;
			dateInput.max = toDate;
			dateInput.required = true;
			dateInputContainer.append(labelElem, dateInput);
			outputControllerForm.append(dateInputContainer);
		}

		outputControllerForm.append(sendBtn);
		
		outputControllerForm.querySelectorAll('input, button').forEach((elem) => {
			elem.disabled = (fromDate && toDate) ? false : true;
		});
	

		outputControllerForm.addEventListener('submit', async e => {
			e.preventDefault();

			const statisticsElem = outputControllerForm.nextElementSibling;
			const periodInfo = await getPeriodInfo(outputControllerForm.from.value, outputControllerForm.to.value);

			if (periodInfo == false) return;

			const periodOutputElem = outputControllerForm.nextElementSibling;

			if (periodOutputElem) {
				return periodOutputElem.replaceWith(createPeriodOutput(periodInfo));
			}

			outputControllerForm.after(createPeriodOutput(periodInfo));
		});

		return outputControllerForm;
	}


	function createPeriodOutput(periodInfo) {
		const periodOutoutContainer = helper.create('div', 'period-output');
		
		if (periodInfo) {
			periodOutoutContainer.append(createStatistics(periodInfo.statistics), createPeriodShifts(periodInfo.shifts));
		} else {
			periodOutoutContainer.textContent = 'Смены за данный период времени отсутствуют.'
		}

		return periodOutoutContainer;
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

		const statisticsContainer = helper.create('ul', 'period-statistics');

		itemsNames.forEach(itemName => {
			const itemElem = helper.create('li', 'period-statistics__item');
			const itemLabelElem = helper.create('span', 'item__label', itemName[1]);
			const itemValueElem = helper.create('span', 'item__value');

			itemValueElem.textContent = `${statistics[itemName[0]] || 0} ${itemName[2]}`;

			itemElem.append(itemLabelElem, itemValueElem);
			statisticsContainer.append(itemElem);
		});

		return statisticsContainer;
	}


	function createPeriodShifts(shifts) {
		const periodShiftsContainer = helper.create('ul', 'period-shifts');


		shifts.forEach(({id, date, start_time: startTime, end_time: endTime}) => {
			const shiftContainer = helper.create('li', 'period-shifts__item');
			const shiftElem = helper.create('div', 'shift');
			const {day: shiftDay, month: shiftMonth} = parseShiftDate(date);
			const shiftDayElem = helper.create('h1', 'shift__day', shiftDay);
			const shiftMonthElem = helper.create('h2', 'shift__month', shiftMonth);
			const shiftTimeElem = helper.create('span', 'shift__time', `${startTime} - ${endTime}`);

			shiftElem.dataset.shiftId = id;
			shiftElem.dataset.shiftDate = date;

			shiftElem.append(shiftDayElem, shiftMonthElem, shiftTimeElem);
			shiftContainer.append(shiftElem);
			periodShiftsContainer.append(shiftContainer);
		});


		periodShiftsContainer.addEventListener('click', async e => {
			const shiftElem = e.target.closest('.shift');

			if (!shiftElem) return;

			const pageContainer = e.target.closest('.page__content');

			[...pageContainer.children].forEach(childElem => childElem.style.display = 'none');

			const shiftVisits = await getShiftVisits(shiftElem.dataset.shiftId);

			if (shiftVisits) {
				const shiftDate = {
					date: shiftElem.dataset.shiftDate,
					timePeriod: shiftElem.querySelector('.shift__time').textContent
				};
	
				pageContainer.append(createShiftOutput(shiftVisits, shiftDate));
			}
		});

		return periodShiftsContainer;
	}


	function createShiftOutput(visits, {date, timePeriod}) {
		const shiftOutputContainer = document.createDocumentFragment();
		const shiftHeaderElem = helper.create('header', 'shift-header');
		const shiftHeadline = helper.create('h4', 'shift-headline', `Смена ${date} ( ${timePeriod} )`);
		const backBtn = helper.create('button', 'btn-return', 'Назад');
		const visitsListElem = helper.create('ul', 'shift-visits');

		for (const [i, visit] of visits.entries()) {
			visitsListElem.append(createVisitRow(visit, i + 1))
		}

		shiftHeaderElem.append(backBtn, shiftHeadline);
		shiftOutputContainer.append(shiftHeaderElem, visitsListElem);


		backBtn.addEventListener('click', e => {
			const pageContainer = e.target.closest('.page__content');

			[...pageContainer.children].forEach(childElem => {
				if (childElem.style.display != 'none') return childElem.remove();

				childElem.style.display = '';
			});
		});


		return shiftOutputContainer;
	}


	function createVisitRow(visit, num) {
		const visitItemsNames = [
			['num', '№'],
			['comment', 'Комментарий :'],
			['start_time', 'Начало :'],
			['end_time', 'Конец :'],
			['discount', 'Скидка :'],
			['total', 'Итого :'],
			['status', 'Статус :'],
			['end_user', 'Завершил :']
		];

		const visitRowElem = helper.create('li', 'shift-visits__item visit');

		for (const [i, visitItemName] of visitItemsNames.entries()) {
			const itemContainer = helper.create('div', 'visit__item');
			const itemLabelElem = helper.create('label', 'visit__item__label', visitItemName[1]);
			const itemValueElem = helper.create('span', 'visit__item__value', (i > 0) ? visit[visitItemName[0]] : num);

			itemContainer.append(itemLabelElem, itemValueElem);
			visitRowElem.append(itemContainer);
		}

		return  visitRowElem;
	}


	function parseShiftDate(stringDate) {
		const shiftDate = new Date(stringDate);
		const parsedDate = {
			day: shiftDate.getDate(),
			month: shiftDate.toLocaleString('ru-RU', {month: 'long'})
		};

		parsedDate.month = parsedDate.month[0].toUpperCase() + parsedDate.month.slice(1);

		return parsedDate;
	}


	//******************** Сервер ********************//

	async function getDatePeriod() {
		const resp = await helper.request('php/sections/archivePage.php', {
			action: 'getDatePeriod'
		});

		return (resp !== null && resp.done) ? resp.data : false;
	}


	async function getPeriodInfo(from, to) {
		const resp = await helper.request('php/sections/archivePage.php', {
			action: 'getPeriodInfo',
			from,
			to
		});

		return (resp !== null && resp.done) ? resp.data : false;
	}


	async function getShiftVisits(shiftId) {
		const resp = await helper.request('php/sections/archivePage.php', {
			action: 'getShiftVisits',
			shiftId
		});

		return (resp !== null && resp.done) ? resp.data : false;
	}

	return {
		getPageContent
	};
})();