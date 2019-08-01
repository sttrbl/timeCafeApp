<?php
	require_once 'connection.php';

	session_start();

	if (trim($_POST['login']) == '' || trim($_POST['password']) == '') {
		exit ( json_encode( array('error' => 'Заполните все поля!') ) );
	}

	$login = $_POST['login'];
	$password = $_POST['password'];

	$stmt = $pdo->prepare('SELECT * FROM users WHERE login = :login');
	$stmt->execute(array('login' => $login));
	$data = $stmt->fetch();

	if (count($data) == 0 ) exit ( json_encode( array('error' => 'Такого пользователя не существует!') ) );

	if ($password == $data['password']){
		$_SESSION['user']['id'] = $data['id'];
		exit ( json_encode( array('success' => 'Авторизация прошла успешно!') ) );
	} else {
		exit ( json_encode( array('error' => 'Неверный пароль!') ) );
	}
 		
?>