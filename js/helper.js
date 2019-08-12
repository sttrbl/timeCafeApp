const helper = (function () {

	function createCustomElement(tag, className, textContent = '') {

		const elem = document.createElement(tag);

		if (className) {
			elem.className = className;
		}

		elem.textContent = textContent;
		return elem;
	}

	function showError(text) {
		// Здесь можно сделать кастомный вариант вывода ошибки
		alert(text);
	}

	function showSuccess(text) {
		// Здесь можно сделать кастомный вариант вывода сообщения
		alert(text);
	}

	function request(URL, data) {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", URL, true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

		return new Promise((resolve, reject) => {
			xhr.onreadystatechange = function () {
				if (xhr.readyState != 4) return;

				if (xhr.status != 200) {
					showError("Ошибка соединения с сервером!");
					reject();
				}

				try {
					const resp = JSON.parse(xhr.responseText);

					if (resp.error) {
						showError(resp.error);
						resolve(false);
					}

					resolve(resp);
				} catch (e) {
					showError("Ошибка чтения данных!");
					reject(e); 
				}
			};

			xhr.send(JSON.stringify(data));
		});

	}

	return {
		create: createCustomElement,
		showError: showError,
		showSuccess: showSuccess,
		request: request
	}

})();