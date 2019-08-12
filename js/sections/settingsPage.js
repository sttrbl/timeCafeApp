//********* Модуль для подготовки компонентов раздела "Настройки" **********//

const settingsPage = (() => {

	function createSettingsPage({
		common: commonSettings,
		users: usersSettings
	}) {
		const content = helper.create('section', 'page__content');
		const settingsPanel = helper.create('div', 'settings');

		settingsPanel.appendChild(createCommonSettingsPanel(commonSettings));
		settingsPanel.appendChild(createUsersSettingsPanel(usersSettings));
		content.appendChild(settingsPanel);

		return content;
	}


	function createCommonSettingsPanel({
		main: mainSettings,
		discounts: discountsSettings
	}) {
		const elem = helper.create('div', 'settings__common');
		const headline = helper.create('h3', 'settings-category', 'Общие настройки :');
		const settingsList = helper.create('div', 'settings-list');

		settingsList.appendChild(createLogoUploader());
		settingsList.appendChild(createMainSettingsPanel(mainSettings));
		settingsList.appendChild(createDiscountEditor(discountsSettings));

		elem.append(headline, settingsList);

		return elem;
	}


	function createLogoUploader() {
		const elem = helper.create('div', 'logo-uploader');
		const img = helper.create('div', 'logo-uploader__img');
		const info = helper.create('div', 'logo-uploader__info');
		const upadateButton = helper.create('button', 'btn btn-update-logo', 'Изменить');
		const hiddenImgInput = helper.create('input', 'hidden-input');

		info.innerHTML = '<span>Размер загружаемого файла <br> не должен превышать 2 Мб.<br> Формат файла - PNG. </span>';
		hiddenImgInput.type = 'file';

		upadateButton.addEventListener('click', argument => hiddenImgInput.click());

		hiddenImgInput.addEventListener('change', e => {
			const file = e.currentTarget.files[0];
			updateLogo(file);
		});

		elem.append(img, info, upadateButton, hiddenImgInput);

		return elem;
	}


	function createMainSettingsPanel(mainSettings) {
		const optionsNames = [
			['Название заведения :', 'org_name'],
			['Первый час :', 'first_cost', ' руб.'],
			['Последующие :', 'next_cost', ' руб/мин.'],
			['Стоп-чек :', 'stop_check', ' руб.']
		];

		const elem = helper.create('form', 'main-settings');
		const fieldList = helper.create('div', 'field-list');
		const saveButton = helper.create('button', 'btn btn-save-main');

		elem.id = 'main-settings';

		optionsNames.forEach((optionName, i) => {
			const fieldElem = helper.create('li', 'field-list__item');
			const label = helper.create('label', 'field__label', optionName[0]);
			const input = helper.create('input', 'field__input');

			input.type = 'text';
			input.name = optionName[1];
			input.value = mainSettings[optionName[1]];

			if (i == 0) {
				fieldElem.append(label, input);
			} else {
				unit = helper.create('span', 'field__unit', optionName[2]);
				fieldElem.append(label, input, unit);
			}

			fieldList.appendChild(fieldElem);
		});


		fieldList.addEventListener('input', e => saveButton.style = 'display: inline-block');


		saveButton.addEventListener('click', e => {
			const fields = elem.elements;
			const newSettings = {};

			for (var i = 0; i < fields.length - 1; i++) {
				newSettings[fields[i].name] = fields[i].value;
			}

			updateMain(newSettings).then(result => {
				const newOrgName = fields['org_name'].value;

				document.querySelector('.logo-container__text').textContent = newOrgName;
				saveButton.style.display = '';
			});

			e.preventDefault();
		});


		elem.append(fieldList, saveButton);

		return elem;
	}


	function createDiscountEditor(discountSettings) {
		const elem = helper.create('div', 'discounts-editor');
		const label = helper.create('label', 'discounts-editor__label', 'Скидки :');
		const editorTable = helper.create('table', 'discounts-editor__table');
		const tableHead = document.createElement('thead');
		const tableBody = document.createElement('tbody');
		const theadRow = helper.create('tr', 'table-header');
		const th1 = helper.create('th', null, 'ID');
		const th2 = helper.create('th', null, 'Название');
		const th3 = helper.create('th', null, 'Размер (%)');

		theadRow.append(th1, th2, th3);
		tableHead.appendChild(theadRow);

		for (let key in discountSettings) {
			const row = helper.create('tr', 'discount-info');
			const id = helper.create('td', 'discount-info__id', key);
			const name = helper.create('td', 'discount-info__name', discountSettings[key]['name']);
			const value = helper.create('td', 'discount-info__value', discountSettings[key]['value']);

			row.append(id, name, value);
			tableBody.appendChild(row);
		}

		const editButton = helper.create('button', 'btn btn-edit-discounts');
		const addButton = helper.create('button', 'btn btn-add-discount', 'Добавить');

		editButton.addEventListener('click', (e) => {
			const self = e.currentTarget;

			if (!self.matches('.active')) {
				addButton.style = 'display:inline-block';
				tableBody.setAttribute('contentEditable', true);
				self.classList.add('active');
				return;
			}

			let newSettings = {};
			const editorRows = tableBody.querySelectorAll('.discount-info');

			editorRows.forEach((row, i) => {
				const id = row.children[0].textContent.trim();

				if (id == '') return;

				newSettings[id] = {};

				const name = editorRows[i].children[1].textContent.trim();
				const value = editorRows[i].children[2].textContent.trim();

				newSettings[id]['name'] = name;
				newSettings[id]['value'] = value;
			});

			if (Object.keys(newSettings).length == 0) {
				newSettings = 'truncate';
			}

			updateDiscounts(newSettings).then(result => {
				const valuesList = tableBody.querySelectorAll('.discount-info__id');

				addButton.style = '';
				tableBody.setAttribute('contentEditable', false);

				for (let i = 0; i < valuesList.length; i++) {

					if (valuesList[i].textContent.trim() != '') continue;

					valuesList[i].closest('tr').remove();
				}

				self.classList.remove('active');
			});
		});

		addButton.addEventListener('click', e => {
			const row = helper.create('tr', 'discount-info');
			const id = helper.create('td', 'discount-info__id');
			const name = helper.create('td', 'discount-info__name');
			const value = helper.create('td', 'discount-info__value');

			row.append(id, name, value);
			tableBody.appendChild(row);
		});

		editorTable.append(tableHead, tableBody);
		elem.append(label, editorTable, editButton, addButton);

		return elem;
	}


	function createUsersSettingsPanel(usersSettings) {
		const elem = helper.create('div', 'settings__users');
		const headline = helper.create('h3', 'settings-category', 'Пользователи :');
		const settingsList = helper.create('div', 'settings-list');

		settingsList.appendChild(createUsersEditor(usersSettings));
		elem.append(headline, settingsList);

		return elem;
	}


	function createUsersEditor(usersInfo) {
		const elem = helper.create('form', 'users-editor');
		const usersList = helper.create('ul', 'users-list');
		const saveButton = helper.create('button', 'btn btn-save-users-changes', 'Сохранить изменения');
		const addUserButton = helper.create('button', 'btn btn btn-add-user', 'Добавить');

		usersInfo.forEach((userInfo) => usersList.appendChild(createUserListRow(userInfo)));

		elem.addEventListener('input', e => {

			if (saveButton.style == '') return;

			saveButton.style = 'display:inline-block';
		});

		saveButton.addEventListener('click', e => {
			const newSettings = [];
			const usersRows = usersList.querySelectorAll('.user');

			usersList.querySelectorAll('.user').forEach(row => {
				const userInfo = {};

				userInfo.id = row.id;
				userInfo.name = row.querySelector('[name="name"]').value;
				userInfo.surname = row.querySelector('[name="surname"]').value;
				userInfo.login = row.querySelector('[name="login"]').value;
				userInfo.password = row.querySelector('[name="password"]').value;
				userInfo.position = row.querySelector('[name="position"]').value;
				newSettings.push(userInfo);
			});

			updateUsers(newSettings).then(result => saveButton.style = '');

			e.preventDefault();
		});

		addUserButton.addEventListener('click', e => {
			usersList.appendChild(createUserListRow());
			e.preventDefault();
		});

		usersList.addEventListener('click', e => {

			if (!e.target.closest('.btn-remove-user')) return;

			const userRow = e.target.closest('.user');
			//мб промис? 
			removeUser(userRow);
			e.preventDefault();
		});

		elem.append(usersList, addUserButton, saveButton);

		return elem;
	}


	function createUserListRow(userInfo) {
		const itemsNames = [
			['Имя', 'name'],
			['Фамилия', 'surname'],
			['Логин', 'login'],
			['Пароль', 'password'],
			['Статус', 'position']
		];

		const elem = helper.create('li', 'users-list__item user');

		if (userInfo) {
			elem.id = userInfo.id;
		}

		itemsNames.forEach(itemName => {
			const item = helper.create('div', 'user__info');
			const label = helper.create('label', 'info-label', itemName[0]);
			let field;

			switch (itemName[1]) {
				case 'position':
					field = document.createElement('select');
					field.append(new Option('Адм.', "adm"), new Option("Сотр.", "emp"));
					break;
				default:
					field = document.createElement('input');
					field.type = 'text';
					break;
			}

			field.name = itemName[1];

			if (userInfo) {
				field.value = userInfo[itemName[1]];
			}

			item.append(label, field);
			elem.appendChild(item);
		});


		const removeUserButton = helper.create('button', 'btn-remove-user');

		removeUserButton.innerHTML = '<i class="fas fa-user-minus"></i>';
		elem.appendChild(removeUserButton);

		return elem;
	}


	//******************** Сервер *************************//
	function getSettings() {
		return helper.request('php/sections/settingsPage.php', {
			action: 'getSettings'
		});
	}


	//(!!!!!) Нужно переписать нативно
	function updateLogo(file) {
		const formData = new FormData();
		formData.append('file', file);

		$.ajax({
			url: 'php/sections/settingsPage.php?updateLogo',
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false,
			success: resp => {

				try {
					resp = JSON.parse(resp);

					if (resp.error) return helper.showError(resp.error);

				} catch (e) {
					helper.showError("Ошибка чтения данных!");
					throw e;
				}

				document.querySelector('.logo-container__img').src = `img/logo.png?'${Math.random()}`;
				document.querySelector('.logo-uploader__img').style = `background-image: url(img/logo.png?${Math.random()})`;
			},
			error: () => {
				helper.showError("Ошибка соединения с сервером!");
			}
		});

	}


	function updateMain(newSettings) {
		return helper.request('php/sections/settingsPage.php', {
			action: 'updateMain',
			newSettings: newSettings
		});
	}


	function updateDiscounts(newSettings) {
		return helper.request('php/sections/settingsPage.php', {
			action: 'updateDiscounts',
			newSettings: newSettings
		});
	}


	async function removeUser(userElem) {
		const resp = await helper.request('php/sections/settingsPage.php', {
			action: 'removeUser',
			userId: userElem.id
		});

		if (!resp) return;

		userElem.remove();
	}


	function updateUsers(newSettings) {
		return helper.request('php/sections/settingsPage.php', {
			action: 'updateUsers',
			newSettings: newSettings
		});
	}


	return {
		getSettings: getSettings,
		getContent: createSettingsPage
	};

})();