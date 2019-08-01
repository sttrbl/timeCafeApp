<?php
session_start();
 
if(isset($_SESSION['user'])){
	header("Location: app.php");
 	exit;
}
?>

<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Авторизация</title>
	<link rel="stylesheet" href="css/authorization.css">
</head>

<body>
	<form>
		<h1>Вход</h1>
			<label for="login">
				Имя пользователя
				<input type="text" id="login" name="login" required />
			</label>
			<label for="password">
				Пароль
				<input type="password" id="password" name="password" required />
			</label>
			<input type="submit" id="enterButton" name="enterButton" value="Войти">
	</form>


<script type="text/javascript" src="js/jquery-3.3.1.min.js"></script>
<script src="js/helper.js"></script>
<script type="text/javascript">
	const form = document.querySelector('form');

	document.getElementById('enterButton').addEventListener('click', (e) => {
		var login = document.getElementById('login').value;
		var password = document.getElementById('password').value;

		$.ajax({
		    type: "POST",
		    url: "php/login.php",
		    data: {login:login, password:password},
		    success: resp => {
		    	try {
		    		resp = JSON.parse(resp);
		    		if (resp.error) return helper.showError(resp.error);
		    	} catch(e) {
		    		helper.showError("Ошибка чтения данных!");
		    		throw e;
		    	}
		 
		    	location.href = "app.php";
		    },
		    error: resp => {
		    	helper.showError("Ошибка соединения с сервером!");
		    }
		});

		e.preventDefault();
	});

</script>

</body>


</html>