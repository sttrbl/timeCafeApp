<?php
	require_once 'connection.php';

	session_start();

	if (trim($_POST['login']) == '' || trim($_POST['password']) == '') {
		$resp = array(
			'done' => false,
			'errorMsg' => 'Заполните все поля!'
		);

		exit(json_encode($resp));
	}

	$login = $_POST['login'];
	$password = $_POST['password'];

	$stmt = $pdo->prepare('SELECT * FROM users WHERE login = :login');
	$stmt->execute(array('login' => $login));
	$data = $stmt->fetch();

	if ($data &&  ($data['password'] == $password) ){
		$_SESSION['user']['id'] = $data['id'];
		
		$resp = array(
			'done' => true,
		);
	} else {
		$resp = array(
			'done' => false,
			'errorMsg' => 'Неверный логин или пароль!'
		);
	}

	exit(json_encode($resp));
?>