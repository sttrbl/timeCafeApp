const helper = (function () {

	function createCustomElement(tag, className, textContent = ''){

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
		// Здесь можно сделать кастомный вариант вывода ошибки
		alert(text);
	}

	return {
		create: createCustomElement,
		showError: showError,
		showSuccess: showSuccess
	}

})();