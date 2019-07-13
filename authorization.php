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
	<title>Авторизация</title>
	<style type="text/css">
		@charset "utf-8";
		@import url('https://fonts.googleapis.com/css?family=Roboto');
		* {
			margin: 0;
		}

		*,
		*:before,
		*:after {
		  box-sizing: border-box;
		}

		body {
			background: #F3F3F3;
		}


		form {
			background: #fff;
			width: 350px;
			margin: 100px auto;
			border: 1px solid #c6c7cc;
			font: 1.2em/1.4 Roboto, Helvetica, Arial, sans-serif;
    		box-shadow: 0 2px 4px 0 rgba(0,0,0,0.1);
    		border-radius: 4px;
    		padding: 40px;
 
		}

		form input {
			border-radius: 3px;
			width: 100%;
		}

		form input[type = "text"],
		form input[type = "password"]  {
			margin-top: 5px;
			border: 1px solid #DBDBDB;
			background-color: rgb(255, 235, 153);
			padding: 5px;
			padding-left: 10px;
			font: 1.2em/1.4 Roboto, Helvetica, Arial, sans-serif;
		}


		form h1 {
			font-size: 1.4em;
			border-bottom: 1px solid #DBDBDB;
			margin-bottom: 1em;
			padding-bottom: 0.5em;
		}

		form label {
			font-weight: bold;
			font-size: 0.7em;
			display: block;
			margin-bottom: 30px;
		}

		form input[type = "submit"] {
			
			background: rgb(72,60,88);
			background: linear-gradient(to top, rgba(72,60,88,1) 11%, rgba(72,60,88,1) 16%, rgba(72,60,88,1) 25%, rgba(60,69,88,1) 48%);
		    border:none;
		    color: #fff;
		    cursor: pointer;
		    font-weight: bold;
		    padding: 12px;
		}

		form input[type = "submit"]:hover {
			background: #303746;
		}

	</style>
</head>
<body>
	<form>
		<h1>Вход</h1>
			<label for="login">
				Имя пользователя
				<input type="text" id="login" name="login" />
			</label>
			<label for="password">
				Пароль
				<input type="password" id="password" name="password" />
			</label>
			<input type="submit" id="enterButton" name="enterButton" value="Войти">
	</form>


<script type="text/javascript" src="js/jquery-3.3.1.min.js"></script>
<script type="text/javascript">
	var form = document.querySelector('form');

	document.getElementById('enterButton').onclick = function(e) {

	var login = document.getElementById('login').value;
	var password = document.getElementById('password').value;

	$.ajax({
	    type: "POST",
	    url: "php/login.php",
	    data: {login:login, password:password},
	    success: function(resp) {
	    	resp = JSON.parse(resp);
	    	if (resp.error) return alert(resp.error);
	    	location.href = "app.php";
	    },
	    error: function(resp) {
	    	alert('Серверная ошибка!');
	    }
	});

	return false;
}
</script>

</body>


</html>