//********* Модуль для подготовки компонентов раздела "Посещения" **********//

const visitsPageModule = (() => {

	async function getPageContent() {
		const pageContent = [];
		const shiftInfo = await getShiftInfo();

		if (shiftInfo === false) {
			throw new Error('Не удалось загрузить информацию о смене.')
		}

		if (shiftInfo !== null) {
			pageContent.push(createDayPanel(shiftInfo.shiftId));
			pageContent.push(createVisitsPanel(shiftInfo));
		} else {
			pageContent.push(createDayPanel());
		}
	
		return pageContent;
	}

	
	function createDayPanel(shiftId) {

		function formatDate(date) {
			const currentDate = date.toLocaleString('ru-RU', {month: 'long', day: 'numeric'});
			const weekday = date.toLocaleString('ru-RU', {weekday: 'long'});

			return  `${currentDate}, ${weekday[0].toUpperCase() + weekday.slice(1)}`
		}

		const dayPanelContainer = helper.create('div', 'day-panel clearfix');
		const dateElem = helper.create('h4', 'day-panel__date', formatDate(new Date()));
		const shiftContollBtn = helper.create('button', 'btn btn-day-controller');

		if (shiftId) {
			shiftContollBtn.classList.add('active');
			dayPanelContainer.dataset.shiftId = shiftId;
		}

		shiftContollBtn.addEventListener('click', async e => {
			
			if (!shiftContollBtn.matches('.active')) {

				if (!confirm('Начать смену?')) return;

				const startedShiftInfo = await startShift();
			
				if (startedShiftInfo) {
					dayPanelContainer.after(createVisitsPanel(startedShiftInfo));
					dayPanelContainer.dataset.shiftId = startedShiftInfo.shiftId;
					shiftContollBtn.classList.toggle('active');
				}

			} else {

				if (!confirm('Завершить смену?')) return;

				const visitsPanelElem = dayPanelContainer.nextElementSibling;
				const operationResult =  await endShift(+dayPanelContainer.dataset.shiftId);

				if (operationResult) {
					visitsPanelElem.remove();
					shiftContollBtn.classList.toggle('active');
					dayPanelContainer.removeAttribute('data-shift-id');
				};
			}
		});

		dayPanelContainer.append(dateElem, shiftContollBtn);
		return dayPanelContainer;
	}


	function createVisitsPanel({visits = null, discounts}) {
		const visitsPanelContainer = helper.create('div', 'visits-panel');
		const visitsListElem = helper.create('ul', 'visits-list');
		const addBtn = helper.create('button', 'btn btn-add-visit', 'Добавить');

		if (visits) {

			for (const [i, visitInfo] of visits.entries()) {
				const newVisitOptions = {
					visitNum: i + 1,
					discounts,
					visitInfo
				}

				visitsListElem.append(createVisit(newVisitOptions));
			}

		}

		
		visitsListElem.addEventListener('click', e => {
			const btn = e.target.closest('button');
			const visitContainer = e.target.closest('.visits-list__item');

			if (!btn) return;

			if (btn.matches('.btn-remove-visit') && confirm('Удалить посещение?') ) {
				removeVisit(visitContainer);
			} else if (btn.matches('.btn-visit-controller')) {
				const visitStatus = visitContainer.classList[1];

				switch (visitStatus) {
					case 'new':	
						startVisit(visitContainer);	
						break;

					case 'active':	
						calculateVisit(visitContainer);
						break;

					case 'calculated':	
						endVisit(visitContainer);	
						break;
				}
			}
		});


		visitsListElem.addEventListener('change', e => {
			if (!e.target.closest('.visit__discount')) return;

			const discountSelectElem = e.target;
			const visitContainer = discountSelectElem.closest('.visits-list__item');
			const totalCostElem = visitContainer.querySelector('.visit__total');
			let totalCost = visitContainer.dataset.pureTotal

			if (!totalCost) return;

			const discountValue = +discountSelectElem.value;

			if (discountValue != 0) {
				totalCost = Math.round(totalCost - ((totalCost / 100) * discountValue));
			}

			totalCostElem.textContent = totalCost;
		});


		addBtn.addEventListener('click', e => {
			const visitsElems = visitsListElem.querySelectorAll('.visit');
			const newVisitOptions = {
				visitNum: visitsElems.length + 1,
				discounts
			};
			
			visitsListElem.append(createVisit(newVisitOptions));
		});


		visitsPanelContainer.append(visitsListElem, addBtn);
		return visitsPanelContainer;
	}

	//Хорошо бы это отрефакторить
	function createVisit({visitNum, discounts, visitInfo}) {
		const visitItemsNames = [
			['№', 'num'],
			['Номерок :', 'person-tag'],
			['Комментарий :', 'comment'],
			['Начало :', 'start-time'],
			['Окончание :', 'end-time'],
			['Скидка :', 'discount'],
			['Итого :', 'total']
		];

		const visitContainer = helper.create('li', 'visits-list__item ');
		const visitInnerContainer = helper.create('ul', 'visit');
		let visitStatus = 'new';
		
		if (visitInfo) {
			visitStatus = visitInfo.status;
			visitContainer.dataset.realId = visitInfo.id;

			if (visitStatus == 'calculated') {
				visitContainer.dataset.pureTotal = visitInfo.total;
			}
		}

		visitContainer.classList.add(visitStatus);
		visitContainer.append(visitInnerContainer);

		for (let i = 0; i < visitItemsNames.length + 2; i++) {
			const itemElem = helper.create('li', 'visit-info-item');
			visitInnerContainer.append(itemElem);
		}

		visitItemsNames.forEach((itemName, i) => {
			const itemHeadlineElem = helper.create('h5', null, itemName[0]);
			let itemContentElem;

			if (visitStatus != 'completed' && itemName[1] == 'discount') {
				itemContentElem = document.createElement('select');
				itemContentElem.append(new Option('', 0));

				for (const discount of discounts) {
					itemContentElem.append(new Option(discount['id'], discount['value']));
				}

			} else if (visitStatus == 'new' && i > 0) {

				switch (itemName[1]) {
					case 'person-tag':
						itemContentElem = document.createElement('input');
						itemContentElem.type = 'number';
						itemContentElem.min = 1;
						itemContentElem.required = true;
						break;
					case 'comment':
						itemContentElem = document.createElement('input');
						itemContentElem.type = 'text';
						itemContentElem.maxLength = 30;
						break;
					default:
						itemContentElem = document.createElement('span');
						break;
				}

			} else {
				itemContentElem = document.createElement('span');
				const itemNameOnServer = itemName[1].replace('-', '_');
				itemContentElem.textContent = (i > 0) ? visitInfo[itemNameOnServer] : visitNum;
			}

			itemContentElem.classList.add('visit__' + itemName[1]);

			visitInnerContainer.children[i].append(itemHeadlineElem, itemContentElem);
		});

		const visitControllBtn = helper.create('button', 'btn btn-visit-controller');
		const visitRemoveBtn = helper.create('button', 'btn-remove-visit');

		visitRemoveBtn.innerHTML = '<i class="far fa-trash-alt"></i>';
		visitInnerContainer.children[visitItemsNames.length].append(visitControllBtn);
		visitInnerContainer.lastElementChild.append(visitRemoveBtn);

		return visitContainer;
	}


	//************** Функции для работы с сервером ***************//

	async function getShiftInfo() {
		const resp = await helper.request('php/sections/visitsPage.php', {
			action: 'getShiftInfo'
		});

		return (resp !== null && resp.done) ? resp.data : false;
	}


	async function startShift() {
		const resp = await helper.request('php/sections/visitsPage.php', {
			action: 'startShift'
		});

		return (resp !== null && resp.done) ? resp.data : false;
	}


	async function endShift(shiftId) {
		const resp = await helper.request('php/sections/visitsPage.php', {
			action: 'endShift',
			shiftId
		});

		return (resp !== null && resp.done) ? true : false;
	}


	async function startVisit(visitNode) {
		const visitInfo = {};
		const allNodeInputs = visitNode.querySelectorAll('input');

		for (let inputElem of allNodeInputs) {
			const inputElemValue = inputElem.value.trim();

			//Валидация поля "Номерок"
			if (inputElem.matches('.visit__person-tag') && !inputElem.reportValidity()) return;

			const visitInfoKey = inputElem.className.replace('-', '_').replace('visit__', '');

			visitInfo[visitInfoKey] = (inputElem.type == 'number') ? +inputElemValue : inputElemValue || null;
		}

		
		const resp = await helper.request('php/sections/visitsPage.php', {
			action: 'startNewVisit',
			visitInfo
		});
		
		if (resp === null || !resp.done) return;

		visitNode.classList.remove('new');
		visitNode.classList.add('active');
		visitNode.dataset.realId = resp.data.visitId;
		visitNode.querySelector('.visit__start-time').textContent = resp.data.startTime;

		allNodeInputs.forEach(inputElem => {
			inputElem.replaceWith(helper.create('span', inputElem.className, inputElem.value));
		});
	}


	async function removeVisit(visitNode) {
		const visitsListElem = visitNode.parentElement;
		const visitsNumsElems = visitsListElem.parentElement.getElementsByClassName('visit__num');
	
		if (!visitNode.matches('.new')) {
			const resp = await helper.request('php/sections/visitsPage.php', {
				action: 'removeVisit',
				visitId: +visitNode.dataset.realId
			});
	
			if (resp === null || !resp.done) return;
		}

		visitNode.remove();
		[].forEach.call(visitsNumsElems, (numElem, i) => numElem.textContent = i + 1);
	}


	async function calculateVisit(visitNode) {
	
		const resp = await helper.request('php/sections/visitsPage.php', {
			action: 'calculateVisit',
			visitId: +visitNode.dataset.realId
		});

		if (resp === null || !resp.done) return;

		const pureTotalCost = resp.data.pureTotal;
		const endTimeElem = visitNode.querySelector('.visit__end-time');
		const totalCostElem = visitNode.querySelector('.visit__total');
		const discountValue = +visitNode.querySelector('.visit__discount').value;

		endTimeElem.textContent = resp.data.endTime;
		visitNode.dataset.pureTotal = pureTotalCost;

		totalCostElem.textContent = discountValue ? pureTotalCost - (pureTotalCost / 100 * discountValue) : pureTotalCost;

		visitNode.classList.remove('active');
		visitNode.classList.add('calculated');
	}


	async function endVisit(visitNode) {
		const discountSelect = visitNode.querySelector('.visit__discount');
		const selectedElem = discountSelect.querySelector('[value ="' + discountSelect.value + '"]');

		const resp = await helper.request('php/sections/visitsPage.php', {
			action: 'endVisit',
			visitInfo: {
				visitId: +visitNode.dataset.realId,
				finalTotal: +visitNode.querySelector('.visit__total').textContent,
				discount: selectedElem.textContent || null
			}
		});

		if (resp === null || !resp.done) return;

		const discountValueSpan = helper.create('span', discountSelect.className, selectedElem.textContent);

		discountSelect.replaceWith(discountValueSpan);
		visitNode.removeAttribute("data-pure-total");
		visitNode.classList.remove('calculated');
		visitNode.classList.add('completed');
	}


	return {
		getPageContent
	};
})();