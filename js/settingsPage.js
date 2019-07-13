const settingsPage = (function () {

	function createSettingsPage(settings) {
		const content = helper.create('section', 'page__content');
		const settingsPanel = helper.create('div', 'settings');

		settingsPanel.appendChild( createCommonSettingsPanel(settings.common) )
		settingsPanel.appendChild( createUsersSettingsPanel(settings.users) );
		content.appendChild(settingsPanel);
		return content;
	}


	function createCommonSettingsPanel(commonSettings) {
		const elem = helper.create('div','settings__common');
		const headline = helper.create('h3', 'settings-category', 'Общие настройки :');
		const settingsList = helper.create('div', 'settings-list');

		settingsList.appendChild( createLogoUploader() );
		settingsList.appendChild( createMainSettingsPanel(commonSettings.main) );
		settingsList.appendChild( createDiscountEditor(commonSettings.discounts) );

		elem.append(headline, settingsList);
		return elem;
	}

	function createLogoUploader() {
		const elem = helper.create('div', 'logo-uploader');
		const img = helper.create('div', 'logo-uploader__img');
		const info = helper.create('div', 'logo-uploader__info');
		const upadateButton = helper.create('button', 'btn btn-update-logo', 'Изменить');
		const hiddenImgInput = helper.create('input','hidden-input');

		info.innerHTML = '<span>Размер загружаемого файла <br> не должен превышать 2 Мб.<br> Формат файла - PNG. </span>'
		hiddenImgInput.type = 'file'; 

		upadateButton.addEventListener('click', function(argument) {
			hiddenImgInput.click();
		});

		hiddenImgInput.addEventListener('change', function(e) {
			const file = this.files[0];
			console.log(file);
			updateLogo(file);
		});

		elem.append(img, info, upadateButton, hiddenImgInput);
		return elem;
	}


	function createMainSettingsPanel(mainSettings) {
		const itemsOptions = [
			['Название заведения :', 'org_name'],
			['Первый час :', 'first_cost', ' руб.'],
			['Последующие :', 'next_cost', ' руб/мин.'],
			['Стоп-чек :', 'stop_check', ' руб.']
		];

		const elem = helper.create('form', 'main-settings')
		const fieldList = helper.create('div','field-list');
		const saveButton = helper.create('button', 'btn btn-save-main');
		elem.id = 'main-settings';
		
		
		for (let i = 0; i < itemsOptions.length; i++) {
			const item = helper.create('li','field-list__item');
		 	const label = helper.create('label', 'field__label', itemsOptions[i][0]);
		 	const input = helper.create('input', 'field__input');

		 	input.type = 'text';
		 	input.name = itemsOptions[i][1];
		 	input.value = mainSettings[ itemsOptions[i][1] ];

		 	if (i == 0) {
		 		item.append(label, input);
		 	} else {
		 		unit = helper.create('span', 'field__unit', itemsOptions[i][2]);
		 		item.append(label, input, unit);
		 	}
		 	
		 	fieldList.appendChild(item);
		}


		fieldList.addEventListener('input', function() {
			saveButton.style = 'display: inline-block'; 
		});


		saveButton.addEventListener('click', function(e) {
			const fields = elem.elements;
			const newSettings = {};

			for (var i = 0; i < fields.length - 1; i++) {
				newSettings[fields[i].name] = fields[i].value;
			}

			updateMain(newSettings).then(result => {
				if (result.error) return alert(result.error);
				const newOrgName = fields['org_name'].value;
				document.querySelector('.logo-container__text').textContent = newOrgName;
				saveButton.style.display = '';
				alert(result.success);
			});

			e.preventDefault();
		});


		elem.append(fieldList, saveButton);
		return elem; 
	}


	function createDiscountEditor(discountSettings) {
		console.log(discountSettings);
		const elem = helper.create('div','discounts-editor');
		const label = helper.create('label','discounts-editor__label','Скидки :');
		const editorTable = helper.create('table', 'discounts-editor__table');
		const tableHead = document.createElement('thead');
		const tableBody = document.createElement('tbody');
		const theadRow = helper.create('tr', 'table-header');
		const th1 = document.createElement('th');
		const th2 = document.createElement('th');
		const th3 = document.createElement('th');
		th1.textContent = 'ID';
		th2.textContent = 'Название';
		th3.textContent = 'Размер (%)';
		theadRow.append(th1,th2,th3);
		tableHead.appendChild(theadRow);

		for (key in discountSettings) {
			const row = helper.create('tr','discount-info');
			const id = helper.create('td','discount-info__id', key);
			const name = helper.create('td', 'discount-info__name', discountSettings[key]['name']);
			const value = helper.create('td', 'discount-info__value', discountSettings[key]['value']);
			row.append(id, name, value);
			tableBody.appendChild(row);
		}
		
		const editButton = helper.create('button', 'btn btn-edit-discounts');
		const addButton = helper.create('button', 'btn btn-add-discount', 'Добавить');

		editButton.addEventListener('click', function() {
			if (!this.matches('.active')) {
				addButton.style = 'display:inline-block';
				tableBody.setAttribute('contentEditable', true);
				return this.classList.add('active');
			} 

			let newSettings = {};
			const editorRows = tableBody.querySelectorAll('.discount-info');

			for (let i = 0; i < editorRows.length; i++) {
				const id = editorRows[i].children[0].textContent.trim();
				if (id == '') continue;
				newSettings[id] = {};
				const name = editorRows[i].children[1].textContent.trim();
				newSettings[id]['name'] = name;
				const value = editorRows[i].children[2].textContent.trim();
				newSettings[id]['value'] = value;
			}

			if (Object.keys(newSettings).length == 0) {
				newSettings = 'truncate';
			}

			updateDiscounts(newSettings).then(result => {
				if (result.error) return alert(result.error);
				const valuesList = tableBody.querySelectorAll('.discount-info__id');
				addButton.style = '';
				tableBody.setAttribute('contentEditable', false);

				for (let i = 0; i < valuesList.length; i++) {
					if ( valuesList[i].textContent.trim() != '') continue;
					valuesList[i].closest('tr').remove();
				}

				this.classList.remove('active');
				alert(result.success);
			});
			
		});

		addButton.addEventListener('click', function(e) {
			const row = helper.create('tr','discount-info');
			const id = helper.create('td','discount-info__id');
			const name = helper.create('td', 'discount-info__name');
			const value = helper.create('td','discount-info__value');
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

		settingsList.appendChild( createUsersEditor(usersSettings) );
		elem.append(headline, settingsList);
		return elem;
	}


	function createUsersEditor(usersInfo) {
		const elem = helper.create('form', 'users-editor');
		const usersList = helper.create('ul', 'users-list');
		const saveButton = helper.create('button', 'btn btn-save-users-changes', 'Сохранить изменения');
		const addUserButton = helper.create('button', 'btn btn btn-add-user', 'Добавить');

		for (var i = 0; i < usersInfo.length; i++) {
			usersList.appendChild( createUserListRow(usersInfo[i]) );
		}

		elem.addEventListener('input', function(e) {
			if (saveButton.style == '') return;
			saveButton.style = 'display:inline-block';
		});

		saveButton.addEventListener('click', function(e) {
			const newSettings = [];
			const usersRows = usersList.querySelectorAll('.user');

			for (var i = 0; i < usersRows.length; i++) {
				const userInfo = {};
				userInfo.id = usersRows[i].id;
				userInfo.name = usersRows[i].querySelector('[name="name"]').value;
				userInfo.surname = usersRows[i].querySelector('[name="surname"]').value;
				userInfo.login = usersRows[i].querySelector('[name="login"]').value;
				userInfo.password = usersRows[i].querySelector('[name="password"]').value;
				userInfo.position = usersRows[i].querySelector('[name="position"]').value;
				newSettings.push(userInfo);
			}

			updateUsers(newSettings).then(result => {
				if (result.error) return alert(result.error);
				saveButton.style = '';
				alert(result.success);
			});

			e.preventDefault();
		});

		addUserButton.addEventListener('click', function(e) {
			usersList.appendChild( createUserListRow() );
			e.preventDefault();
		});

		usersList.addEventListener('click', function(e) {
			if (!e.target.closest('.btn-remove-user')) return;
			const userRow = e.target.closest('.user');
			removeUser(userRow);
			e.preventDefault();
		});
		
		elem.append(usersList,addUserButton, saveButton);
		return elem;
	}


	function createUserListRow(userInfo) {
		const itemsNames = [
			['Имя', 'name'], ['Фамилия', 'surname'], ['Логин', 'login'], 
			['Пароль', 'password'], ['Статус', 'position']
		];

		const elem = helper.create('li', 'users-list__item user');

		if (userInfo) {
			elem.id = userInfo.id;
		}
		
		for (var i = 0; i < itemsNames.length; i++) {
			const item = helper.create('div', 'user__info');
			const label = helper.create('label', 'info-label', itemsNames[i][0]);
			let field;

			if ( itemsNames[i][1] == 'position') {
				field = document.createElement('select');
				field.append( new Option('Адм.', "adm"), new Option("Сотр.", "emp") );
			} else {
				field = document.createElement('input');
				field.type = 'text';
			}
			
			field.name = itemsNames[i][1];

			if (userInfo) {
				field.value = userInfo[ itemsNames[i][1] ];
			}

			item.append(label, field);
			elem.appendChild(item);
		}

		const removeUserButton = helper.create('button', 'btn-remove-user');
		removeUserButton.innerHTML = '<i class="fas fa-user-minus"></i>';

		elem.appendChild(removeUserButton);
		return elem;
	}


//********************Сервер*************************//

	function getSettings() {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/settingsPage.php",
			    data: {action:'getSettings'},
			    success: function(resp) {
			    	resp = JSON.parse(resp);
					if (resp.error) return alert(resp.error);
	       			resolve(resp);
		        },
		        error: function() {
		        	reject();
		        }
			});
		});
	}

	function updateLogo(file) {
		const formData = new FormData();
		formData.append('file', file);

		$.ajax({
            url: 'php/settingsPage.php?updateLogo',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(resp) {
		    	resp = JSON.parse(resp);
				if (resp.error) return alert(resp.error);
				document.querySelector('.logo-container__img').src = 'img/logo.png?' + Math.random();
				document.querySelector('.logo-uploader__img').style = 'background-image: url(img/logo.png?' + Math.random()+')';
	    	},
	        error: function() {
	        	alert('Ошибка сервера!');
	        }
  		});

	}

	function updateMain(newSettings) {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/settingsPage.php",
			    data: {action:'updateMain', newSettings:newSettings},
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

	function updateDiscounts(newSettings) {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/settingsPage.php",
			    data: {action:'updateDiscounts', newSettings:newSettings},
			    success: function(resp) {
			    	resp = JSON.parse(resp);
			    	console.log(resp);
	       			resolve(resp);
		        },
		        error: function() {
		        	reject()
		        }
			});
		});
	}

	function removeUser(userElem) {
		$.ajax({
		    type: "POST",
		    url: "php/settingsPage.php",
		    data: {action:'removeUser', userId:userElem.id},
		    success: function(resp) {
		    	resp = JSON.parse(resp);
		    	if (resp.error) return alert(resp.error);

		    	alert(resp.success);
		    	userElem.remove();
	        },
	        error: function() {
	        }
		});
	}


	function updateUsers(newSettings) {
		return new Promise((resolve, reject) => {
			$.ajax({
			    type: "POST",
			    url: "php/settingsPage.php",
			    data: {action:'updateUsers', newSettings:newSettings},
			    success: function(resp) {
			    	resp = JSON.parse(resp);
	       			resolve(resp);
		        },
		        error: function() {
		        	reject();
		        }
			});
		});
	}

	return {
		getSettings: getSettings, 
		getElem: createSettingsPage
	}
})(); 