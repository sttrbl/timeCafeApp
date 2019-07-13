<?php
require_once 'connection.php';

session_start();

if ($_SESSION['user']['position'] != 'adm') {
	exit(json_encode( array('error' => 'Ошибка доступа!') ));
}


if ( isset( $_GET['updateLogo'] ) ) {
	$action = 'updateLogo';
} else {
	$action = $_POST['action'];
}


switch ($action) {

	case 'getSettings':
        getSettings();
        break;
    case 'updateLogo':
        updateLogo();
        break;
    case 'updateMain':
        updateMain($_POST['newSettings']);
        break;
    case 'updateDiscounts':
        updateDiscounts($_POST['newSettings']);
        break;
    case 'removeUser':
        removeUser($_POST['userId']);
        break;
    case 'updateUsers':
        updateUsers($_POST['newSettings']);
        break;
};

function getSettings() {
	global $pdo;

	$users = $pdo->query('SELECT * FROM users')->fetchAll();
	$main = $pdo->query('SELECT * FROM settings')->fetchAll(PDO::FETCH_KEY_PAIR);
	$discounts = $pdo->query('SELECT * FROM discounts')->fetchAll(PDO::FETCH_UNIQUE);

	$common = array('main' => $main, 'discounts' => $discounts);

	echo json_encode( array('common' => $common, 'users' => $users) );
}

function updateLogo() {
	$filename = '../img/logo.png';
	unlink($filename); 
	
	move_uploaded_file($_FILES['file']['tmp_name'], '../img/logo.png');
 	echo json_encode( array('success' => $_FILES['file']['tmp_name']) );
}



function updateMain($newSettings) {

	function validate($values) {
		foreach ($values as $key => $value) {
			if ( $key != 'org_name' && !is_numeric($value) ) return false;
		}
		return true;
	}

	global $pdo;

	if (!validate($newSettings)) {
		exit(json_encode( array('error' => 'Ошибка ввода!') ) );
	}

	$stmt = $pdo->prepare("INSERT INTO settings (name, value) VALUES ('first_cost',:first_cost), ('next_cost',:next_cost), ('org_name',:org_name), ('stop_check',:stop_check) ON DUPLICATE KEY UPDATE value = VALUES(value)");
	$stmt->execute($newSettings);		
	
	exit(json_encode( array('success' => 'Настройки обновлены') ) );
}


function updateDiscounts($newSettings) {

	function validate($values) {
		return true;
	}

	function prepareSqlString($values) {
		$sql = '';

		foreach ($values as $key => $value) {
			$sql.= "('".$key."','".$value['name']."','".$value['value']."'),";
		}

		return rtrim($sql, ",");
	}

	global $pdo;

	$pdo->query('SET FOREIGN_KEY_CHECKS = 0');
	$pdo->query('TRUNCATE TABLE discounts');
	$pdo->query('SET FOREIGN_KEY_CHECKS = 1');

	if ($newSettings != 'truncate') {
		$sql = "INSERT INTO discounts (id, name, value) VALUES".prepareSqlString($newSettings);
		$pdo->query($sql);
	}

	exit(json_encode( array('success' => 'Настройки обновлены') ) );
}

function removeUser($userId) {
	global $pdo;

	if ($userId == $_SESSION['user']['id']) {
		exit(json_encode( array('error' => 'Этим пользователем являетесь вы!') ) );
	}

	$stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
	$stmt->execute(array($userId));	

	exit(json_encode( array('success' => 'Пользователь удален.') ) );
}

function updateUsers($newSettings) {
	global $pdo;

	function validate(){
		return true;
	}

	function prepareSqlString($users) {
		$sql = '';

		foreach ($users as &$value) {

			$id = trim($value['id']);

			if ( $id == '') {
				$id = 'NULL';
			} 

			$sql.= "(".$id.",'".$value['surname']."','".$value['name']."','".$value['login']."','".$value['password']."','".$value['position']."'),";
		}

		return rtrim($sql, ",");
	}


	$pdo->query("INSERT INTO users (id, surname,name,login,password,position) 
			VALUES ".prepareSqlString($newSettings)." ON DUPLICATE KEY 
			UPDATE surname= VALUES(surname),name= VALUES(name),login= VALUES(login),
			password= VALUES(password),position= VALUES(position)");

	exit(json_encode( array('success' => 'Настройки обновлены') ) );
}

?>