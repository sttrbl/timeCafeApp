const helper = (function () {

	function createCustomElement(tag, classname, textContent){
		const elem = document.createElement(tag);
		elem.className = classname;
		elem.textContent = textContent;
		return elem;
	}

	function showError(text) {
		// Здесь можно сделать кастомный вариант вывода ошибки
		alert(text);
	}

	return {
		create: createCustomElement,
		showError: showError
	}

})();