const helper = (function () {
	const alertElem = document.querySelector('.alert');

	function createCustomElement(tag, className, textContent) {

		const elem = document.createElement(tag);

		if (className) {
			elem.className = className;
		}

		if (textContent) {
			elem.textContent = textContent;
		}

		return elem;
	}

	function showError(text) {
		alertElem.classList.remove('success');
		alertElem.classList.add('error');
		alertElem.textContent = text;
		alertElem.style.opacity = 100;

		setTimeout(() => {
			alertElem.style.opacity = 0;
		}, 3000);
	}

	function showSuccess(text) {
		alertElem.classList.remove('error');
		alertElem.classList.add('success');
		alertElem.textContent = text;
		alertElem.style.opacity = 100;

		setTimeout(() => {
			alertElem.style.opacity = 0;
		}, 3000);
	}


	//Любой запрос возвращает тело ответа в случае успеха и null в случае ошибки
	async function request(URL, data) {
		let resp, respBody;

		try {
			resp = await fetch(URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json;charset=utf-8'
				},
				body: JSON.stringify(data)
			});

			if (!resp.ok) throw new Error(resp.status);
	
			respBody = await resp.json();

		} catch(e) {
			showError("Серверная ошибка!");

			if (e instanceof SyntaxError) {
				console.log(`Ошибка чтения данных: ${e.message}`);
			}
			else {
				console.log(`Ошибка соединения с сервером: ${e.message}`);
			}

			return null;
		}

		if (respBody.errorMsg) showError(respBody.errorMsg);
		if (respBody.successMsg) showSuccess(respBody.successMsg);

		return respBody;
	}


	return {
		create: createCustomElement,
		showError,
		showSuccess,
		request
	}

})();