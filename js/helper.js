const helper = (function () {

	function createCustomElement(type, classname, content){
		const elem = document.createElement(type);
		elem.className = classname;
		elem.textContent = content;
		return elem;
	}

	return {
		create: createCustomElement
	}

})();