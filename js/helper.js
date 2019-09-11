const helper = (function () {
  const alertElem = document.querySelector('.alert');

  const timers = {
    opacity: null,
    waiting: null,
    height: null,

    clearTimers() {
      clearInterval(this.opacity);
      clearTimeout(this.waiting);
      clearInterval(this.height);
    }
  };


  function createCustomElement(tag, className, textContent) {

    const elem = document.createElement(tag);

    if (className) {
      elem.className = className;
    }

    elem.textContent = textContent || null;

    return elem;
  }


  function showMessage() {
    timers.clearTimers();

    alertElem.style.height = alertElem.style.opacity  = '';
    alertElem.style.display = 'block';

    let opacityValue = 0;
    let heightValue = alertElem.offsetHeight;

    timers.opacity =  setInterval(() => {
      opacityValue += 0.08;
      alertElem.style.opacity = opacityValue.toFixed(3);

      if (opacityValue >= 0.8) {
        clearInterval(timers.opacity);

        timers.waiting = setTimeout(() => {
          timers.height = setInterval(() => {
            heightValue -= 2;
            alertElem.style.height = `${heightValue.toFixed(3)}px`;

            if (heightValue <= 0) {
              timers.clearTimers();
              alertElem.style.display = 'none';
            }

          }, 10);

        }, 3000);
      }
    }, 10);
  }


  function showSuccess(message) {
    alertElem.style.backgroundColor = '#329e1c';
    alertElem.textContent = message;
    showMessage();
  }


  function showError(message) {
    alertElem.style.backgroundColor = '#ef6c1b';
    alertElem.textContent = message;
    showMessage();
  }


  //Любой запрос возвращает тело ответа в случае успеха и null в случае ошибки
  async function request(URL, data) {
    let resp, respBody;

    try {
      resp = await fetch(URL, {
        method: 'POST',
        body: (data instanceof FormData) ? data : JSON.stringify(data)
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
