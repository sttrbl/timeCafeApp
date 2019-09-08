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
	<div class="alert"></div>
	<form>
		<h1>Вход</h1>
			<label for="login">
				Имя пользователя
				<input type="text" id="login" name="login" required />
			</label>
			<label for="password">
				Пароль
				<input type="password" name="password" required />
			</label>
			<input type="submit"  name="enterButton" value="Войти">
	</form>


	<script src="js/helper.js"></script>

	<script type="text/javascript">
		const form = document.querySelector('form');

		form.addEventListener('submit', async e => {
			e.preventDefault();
		
			const resp = await helper.request('php/login.php', new FormData(form));

			if (resp === null || !resp.done) return;

			location.href = "app.php";
		});
	</script>

</body>


</html>