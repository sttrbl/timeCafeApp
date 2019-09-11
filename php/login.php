<?php
session_start();

require_once 'connection.php';

if (trim($_POST['login']) == '' || trim($_POST['password']) == '') {
  $resp = array(
    'done' => false,
    'errorMsg' => 'Заполните все поля!'
  );

  exit(json_encode($resp));
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE BINARY login = :login');
$stmt->execute(array('login' => $_POST['login']));
$userInfo = $stmt->fetch();

if ($userInfo &&  ($userInfo['password'] == $_POST['password']) ){
  $_SESSION['user']['id'] = $userInfo['id'];

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
