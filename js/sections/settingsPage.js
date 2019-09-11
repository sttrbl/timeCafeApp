//********* Модуль для подготовки компонентов раздела "Настройки" **********//

const settingsPageModule = (() => {

  async function getPageContent() {
    const pageContent = [];
    const settingsPanelElem = helper.create('div', 'settings');
    const settings = await getSettings();

    if (settings === false) {
      throw new Error('Не удалось загрузить информацию о настройках.')
    }

    settingsPanelElem.append(createCommonSettingsPanel(settings.common));
    settingsPanelElem.append(createUsersSettingsPanel(settings.users));
    pageContent.push(settingsPanelElem);

    return pageContent;
  }


  function createCommonSettingsPanel({
    main: mainSettings,
    discounts: discountsSettings
  }) {
    const commonSettingsContainer = helper.create('div', 'settings__common');
    const headlineElem = helper.create('h3', 'settings-category', 'Общие настройки :');
    const settingsListElem = helper.create('div', 'settings-list');

    settingsListElem.append(createLogoUploader());
    settingsListElem.append(createMainSettingsPanel(mainSettings));
    settingsListElem.append(createDiscountEditor(discountsSettings));

    commonSettingsContainer.append(headlineElem, settingsListElem);

    return commonSettingsContainer;
  }


  function createLogoUploader() {
    const logoUploaderElem = helper.create('div', 'logo-uploader');
    const imgElem = helper.create('div', 'logo-uploader__img');
    const infoElem = helper.create('div', 'logo-uploader__info');
    const upadateBtn = helper.create('button', 'btn btn-update-logo', 'Изменить');
    const hiddenFileInput = helper.create('input', 'hidden-input');

    hiddenFileInput.type = 'file';
    hiddenFileInput.accept = "image/png";
    infoElem.innerHTML = '<span>Размер загружаемого файла <br> не должен превышать 2 Мб.<br> Формат файла - PNG. </span>';

    logoUploaderElem.append(imgElem, infoElem, upadateBtn, hiddenFileInput);


    upadateBtn.addEventListener('click', e => hiddenFileInput.click());


    hiddenFileInput.addEventListener('change', async e => {
      const file = e.currentTarget.files[0];
      const operationResult = await updateLogo(file);

      if (operationResult) {
        document.querySelector('.logo-container__img').src = `img/logo.png?'${Math.random()}`;
        document.querySelector('.logo-uploader__img').style = `background-image: url(img/logo.png?${Math.random()})`;
      }
    });


    return logoUploaderElem;
  }


  function createMainSettingsPanel(settings) {
    const optionsNames = [
      ['Название заведения :', 'org_name'],
      ['Первый час :', 'first_cost', ' руб.'],
      ['Последующие :', 'next_cost', ' руб/мин.'],
      ['Стоп-чек :', 'stop_check', ' руб.']
    ];

    const mainSettingsForm = helper.create('form', 'main-settings');
    const fieldListElem = helper.create('ul', 'field-list');
    const saveBtn = helper.create('button', 'btn btn-save-main');

    saveBtn.hidden = true;

    optionsNames.forEach((optionName, i) => {
      const fieldListItemElem = helper.create('li', 'field-list__item');
      const labelElem = helper.create('label', 'field__label', optionName[0]);
      const inputElem = helper.create('input', 'field__input');

      inputElem.name = optionName[1];
      inputElem.value = settings[optionName[1]];
      inputElem.required = true;

      if (optionName[1] == 'org_name') {
        inputElem.type = 'text';
        inputElem.maxLength = 20;
        fieldListItemElem.append(labelElem, inputElem);
      } else {
        inputElem.type = 'number';
        inputElem.min = 1;
        unitElem = helper.create('span', 'field__unit', optionName[2]);
        fieldListItemElem.append(labelElem, inputElem, unitElem);
      }

      fieldListElem.append(fieldListItemElem);
    });

    mainSettingsForm.append(fieldListElem, saveBtn);

    mainSettingsForm.addEventListener('input', e => {
      if (!saveBtn.hidden) return;
      saveBtn.hidden = false;
    });


    mainSettingsForm.addEventListener('submit', async e => {
      e.preventDefault();

      const operationResult = await updateMain(mainSettingsForm);

      if (operationResult) {
        const newOrgName = mainSettingsForm['org_name'].value;

        document.querySelector('.logo-container__text').textContent = newOrgName;
        document.querySelector('.mobile-header__text').textContent = newOrgName;
        saveBtn.hidden = true;
      }
    });


    return mainSettingsForm;
  }


  function createDiscountEditor(settings) {

    function createDiscountRow(...options) {
      const rowElem = helper.create('tr', 'discount-info');

      for (let i = 0; i < 3; i++) {
        const cellElem = helper.create('td', null, options[i] || null);
        rowElem.append(cellElem);

        if (!options.length) cellElem.contentEditable = "true";
      }

      return rowElem;
    }

    const discountEditorContainer = helper.create('div', 'discounts-editor');
    const labelElem = helper.create('label', 'discounts-editor__label', 'Скидки :');
    const tableElem = helper.create('table', 'discounts-editor__table');
    const theadElem = document.createElement('thead');
    const tbodyElem  = document.createElement('tbody');
    const theadRowElem = helper.create('tr', 'table-header');
    const editBtn = helper.create('button', 'btn btn-edit-discounts');
    const addBtn = helper.create('button', 'btn btn-add-discount', 'Добавить');
    const permissibleLengths = [6,20,3];
    //Живая коллекция всех ячеек в tbody
    const tdElems = tbodyElem.getElementsByTagName('td');

    addBtn.hidden = true;
    theadElem.append(theadRowElem);
    tableElem.append(theadElem, tbodyElem);
    discountEditorContainer.append(labelElem, tableElem, editBtn, addBtn);

    ['ID', 'Название', 'Размер (%)'].forEach(columnName => {
      theadRowElem.append( helper.create('th', null, columnName))
    });

    for (const key in settings) {
      tbodyElem.append( createDiscountRow(key, settings[key].name, settings[key].value) );
    }


    editBtn.addEventListener('click', e => {
      if (e.currentTarget.matches('.active')) {
        return tableElem.dispatchEvent(new CustomEvent('save-discounts'));
      }

      e.currentTarget.classList.add('active');
      addBtn.hidden = false;

      [...tdElems].forEach(cell => cell.contentEditable = "true");
    });


    addBtn.addEventListener('click', e => tbodyElem.append( createDiscountRow() ) );

    //Лучше переписать
    tbodyElem.addEventListener('keydown', e => {
      const cell = e.target;
      const cellIndex = cell.cellIndex;

      if (e.code == 'Enter') {
        e.preventDefault();
        return tableElem.dispatchEvent(new CustomEvent('save-discounts'));
      }

      if (document.getSelection().isCollapsed) {
        if (cellIndex != 1 && e.code == 'Space' ||
            e.key.length == 1 && !e.ctrlKey  &&  cell.textContent.length == permissibleLengths[cellIndex]) {
          e.preventDefault();
        }
      }
    });


    tbodyElem.addEventListener('input', e => {
      const cellIndex = e.target.cellIndex;
      let cellText = e.target.textContent;

      if (cellIndex != 1 )  {
        cellText = cellText.replace(/\s+/g, '');
      }

      if (cellIndex == 2) {
        cellText = cellText.replace(/[^0-9]/g, '');

        if (cellText > 100) cellText = '100';
      }

      e.target.textContent = cellText.slice(0, permissibleLengths[cellIndex]);
    });


    tableElem.addEventListener('save-discounts', async e => {
      let newSettings = {};

      for (const discountRowElem of [...tbodyElem.rows]) {
        const discountId = discountRowElem.cells[0].textContent.trim();
        const discountName = discountRowElem.cells[1].textContent.trim() || null;
        let discountValue = +discountRowElem.cells[2].textContent.trim();

        if (discountId === '' || !discountValue) {
          discountRowElem.remove();
          continue;
        }

        if (discountValue > 100) {
          discountValue = 100;
        }

        newSettings[discountId] = {
          name: discountName,
          value: discountValue
        };
      }

      const operationResult = await updateDiscounts(newSettings);

      if (operationResult) {
        editBtn.classList.remove('active');
        addBtn.hidden = true;
        Array.from(tdElems).forEach(cell => cell.contentEditable = "false");
      }
    });


    return discountEditorContainer;
  }


  function createUsersSettingsPanel(usersSettings) {
    const usersSettingsContainer = helper.create('div', 'settings__users');
    const headlineElem = helper.create('h3', 'settings-category', 'Пользователи :');
    const settingsListElem = helper.create('div', 'settings-list');

    settingsListElem.append( createUsersEditor(usersSettings) );
    usersSettingsContainer.append(headlineElem, settingsListElem);

    return usersSettingsContainer;
  }


  function createUsersEditor(usersInfo) {
    const usersEditorForm = helper.create('form', 'users-editor');
    const usersListElem = helper.create('ul', 'users-list');
    const saveBtn = helper.create('button', 'btn btn-save-users-changes', 'Сохранить изменения');
    const addUserBtn = helper.create('button', 'btn btn btn-add-user', 'Добавить');

    saveBtn.hidden = true;
    usersInfo.forEach(userInfo => usersListElem.append( createUserListRow(userInfo) ));
    usersEditorForm.append(usersListElem, addUserBtn, saveBtn);


    usersListElem.addEventListener('input', e => {
      if (!saveBtn.hidden) return;

      saveBtn.hidden = false;
    });


    usersListElem.addEventListener('focusin', e => {
      if (e.target.name == 'password') e.target.type = 'text';
    });


    usersListElem.addEventListener('focusout', e => {
      if (e.target.name == 'password') e.target.type = 'password';
    });


    addUserBtn.addEventListener('click', e => {
      e.preventDefault();
      usersListElem.append( createUserListRow() );
    });


    usersListElem.addEventListener('keydown', e => {
      if (e.code != 'Enter' || e.target.tagName == 'BUTTON') return;

      e.preventDefault();
      saveBtn.click();
    });


    usersListElem.addEventListener('click', async e => {
      e.preventDefault();

      if (!e.target.closest('.btn-remove-user')) return;

      const userRowElem = e.target.closest('.user');
      const userId = userRowElem.dataset.userId;

      if (userId) {
        if (!confirm('Удалить пользователя?') || !( await removeUser(userId) ) ) return;
      }

      userRowElem.remove();
    });


    usersEditorForm.addEventListener('submit', async e => {
      e.preventDefault();

      const newSettings = [];

      for (userRowElem  of usersListElem.children) {
        const userInfo = {
          id: userRowElem.dataset.userId || null,
          name: userRowElem.querySelector('[name="name"]').value,
          surname: userRowElem.querySelector('[name="surname"]').value,
          login: userRowElem.querySelector('[name="login"]').value,
          password: userRowElem.querySelector('[name="password"]').value,
          position: userRowElem.querySelector('[name="position"]').value
        };

        newSettings.push(userInfo);
      }

      if ( await updateUsers(newSettings) ) saveBtn.hidden = true;
    });


    return usersEditorForm;
  }


  function createUserListRow(userInfo) {
    const itemsNames = [
      ['Имя :', 'name'],
      ['Фамилия :', 'surname'],
      ['Логин :', 'login'],
      ['Пароль :', 'password'],
      ['Статус :', 'position']
    ];

    const userRowElem = helper.create('li', 'users-list__item user');
    const removeUserBtn = helper.create('button', 'btn-remove-user');

    removeUserBtn.innerHTML = '<i class="fas fa-user-minus"></i>';

    if (userInfo) userRowElem.dataset.userId = userInfo.id;

    itemsNames.forEach(itemName => {
      const userRowItemElem = helper.create('div', 'user__info');
      const labelElem = helper.create('label', 'info-label', itemName[0]);
      let fieldElem;

      if (itemName[1] == 'position') {
        fieldElem = document.createElement('select');
        fieldElem.append(new Option('Адм.', "adm"), new Option("Сотр.", "emp"));
      } else {
        fieldElem = document.createElement('input');
        fieldElem.type = (itemName[1] == 'password') ? 'password' : 'text';
      }

      fieldElem.required = true;
      fieldElem.value = (userInfo) ? userInfo[itemName[1]] : '';
      fieldElem.name = itemName[1];

      userRowItemElem.append(labelElem, fieldElem);
      userRowElem.append(userRowItemElem);
    });

    userRowElem.append(removeUserBtn);

    return userRowElem;
  }


  //******************** Сервер *************************//
  async function getSettings() {
    const resp = await helper.request('php/sections/settingsPage.php', {
      action: 'getSettings'
    });

    return (resp !== null && resp.done) ? resp.data : false;
  }


  async function updateLogo(file) {
    const formData = new FormData();

    formData.append('logo', file);
    formData.append('action', 'updateLogo');

    const resp = await helper.request('php/sections/settingsPage.php', formData);

    return (resp !== null && resp.done) ? true : false;
  }


  async function updateMain(mainSettingsForm) {
    const formData = new FormData(mainSettingsForm);

    formData.append('action', 'updateMain');

    const resp = await helper.request('php/sections/settingsPage.php', formData);

    return (resp !== null && resp.done) ? true : false;
  }


  async function updateDiscounts(newSettings) {
    const resp = await helper.request('php/sections/settingsPage.php', {
      action: 'updateDiscounts',
      newSettings
    });

    return (resp !== null && resp.done) ? true : false;
  }


  async function updateUsers(newSettings) {
    const resp = await helper.request('php/sections/settingsPage.php', {
      action: 'updateUsers',
      newSettings
    });

    return (resp !== null && resp.done) ? true : false;
  }


  async function removeUser(userId) {
    const resp = await helper.request('php/sections/settingsPage.php', {
      action: 'removeUser',
      userId
    });

    return (resp !== null && resp.done) ? true : false;
  }


  return {
    getPageContent
  };

})();
