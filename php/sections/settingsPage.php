<?php
require_once '../connection.php';

session_start();

if ($_SESSION['user']['position'] != 'adm') {
	$resp = array(
		'done' => false,
		'errorMsg' => 'Ошибка доступа!'
	);

	exit( json_encode($resp) );
}

if ( isset( $_GET['updateLogo'] ) ) {
	$action = 'updateLogo';
} else {
	$postData = file_get_contents('php://input');
	$data = json_decode($postData, true);

	$action = $data['action'];
}


switch ($action) {

	case 'getSettings':
        getSettings();
        break;
    case 'updateLogo':
        updateLogo();
        break;
    case 'updateMain':
        updateMain($data['newSettings']);
        break;
    case 'updateDiscounts':
        updateDiscounts($data['newSettings']);
        break;
    case 'removeUser':
        removeUser($data['userId']);
        break;
    case 'updateUsers':
        updateUsers($data['newSettings']);
        break;
};


function getSettings() {
	global $pdo;

	$users = $pdo->query('SELECT * FROM users')->fetchAll();
	$main = $pdo->query('SELECT * FROM settings')->fetchAll(PDO::FETCH_KEY_PAIR);
	$discounts = $pdo->query('SELECT * FROM discounts')->fetchAll(PDO::FETCH_UNIQUE);

	$common = array('main' => $main, 'discounts' => $discounts);

	$resp = array(
		'done' => true,
		'data' => array(
			'common' => $common, 
			'users' => $users
		)
	);

	echo json_encode($resp);
}

function updateLogo() {
	$filename = '../../img/logo.png';
	unlink($filename); 
	
	move_uploaded_file($_FILES['file']['tmp_name'], '../../img/logo.png');

	$resp = array(
		'done' => true,
		'successMsg' => 'Логотип обновлен.'
	);

 	echo json_encode($resp);
}



function updateMain($newSettings) {
	//Дописать
	function validate($values) {
		foreach ($values as $key => $value) {
			if ( $key != 'org_name' && ( !is_numeric($value) || $value <= 0) ) {
				$resp = array(
					'done' => false,
					'errorMsg' => 'Некорректное значения числового поля!'
				);
		
				exit( json_encode($resp) );
			} 

			if ($key == 'org_name' && ($value == '' || strlen($value) > 20) ) {
				$resp = array(
					'done' => false,
					'errorMsg' => 'Некорректное название заведения!'
				);
		
				exit( json_encode($resp) );
			}
		}
	}

	global $pdo;

	$newSettings['org_name'] = trim($newSettings['org_name']);

	validate($newSettings);

	$stmt = $pdo->prepare("INSERT INTO settings (name, value) VALUES ('first_cost',:first_cost), ('next_cost',:next_cost), ('org_name',:org_name), ('stop_check',:stop_check) ON DUPLICATE KEY UPDATE value = VALUES(value)");
	$stmt->execute($newSettings);		

	$resp = array(
		'done' => true,
		'successMsg' => 'Общие настройки обновлены.'
	);

 	echo json_encode($resp);
}


function updateDiscounts($newSettings) {
	function prepareSqlString($values) {
		$sql = '';

		foreach ($values as $key => $value) {
			$sql.= "('".$key."','".$value['name']."','".$value['value']."'),";
		}

		return rtrim($sql, ",");
	}

	//Дописать
	function validate($values) {
		
	}

	global $pdo;

	$pdo->query('SET FOREIGN_KEY_CHECKS = 0');
	$pdo->query('TRUNCATE TABLE discounts');
	$pdo->query('SET FOREIGN_KEY_CHECKS = 1');

	if ($newSettings) {
		$sql = "INSERT INTO discounts (id, name, value) VALUES".prepareSqlString($newSettings);
		$pdo->query($sql);
	}

	$resp = array(
		'done' => true,
		'successMsg' => 'Информация о скидках обновлена.'
	);

 	echo json_encode($resp);

}


function removeUser($userId) {
	global $pdo;
	

	if ($userId == $_SESSION['user']['id']) {
		$resp = array(
			'done' => false,
			'errorMsg' => 'Этим пользователем являетесь вы!'
		);
		exit(json_encode($resp) );
	}

	$stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
	$stmt->execute(array($userId));	

	$resp = array(
		'done' => true,
		'successMsg' => 'Пользователь удален.'
	);

 	echo json_encode($resp);
}


function updateUsers($newSettings) {
	global $pdo;

	//Дописать
	function validate(){
		
	}

	function prepareSqlString($users) {
		$sql = '';

		foreach ($users as &$user) {
			$userId = $user['id'];
			
			if ( $userId == null) {
				$userId = 'NULL';
			} 

			$sql.= "(".$userId.",'".$user['surname']."','".$user['name']."','".$user['login']."','".$user['password']."','".$user['position']."'),";
		}

		return rtrim($sql, ",");
	}


	$pdo->query("INSERT INTO users (id, surname,name,login,password,position) 
			VALUES ".prepareSqlString($newSettings)." ON DUPLICATE KEY 
			UPDATE surname= VALUES(surname),name= VALUES(name),login= VALUES(login),
			password= VALUES(password),position= VALUES(position)");

	$resp = array(
		'done' => true,
		'successMsg' => 'Информация о пользователях обновлена.'
	);

	echo json_encode($resp);
}

?>