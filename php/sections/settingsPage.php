<?php
session_start();

require_once '../connection.php';
require_once '../common.php';


$userPosition = $pdo->query("SELECT position  FROM users WHERE id =".$_SESSION['user']['id'])->fetchColumn();


if ($userPosition != 'adm') {
  $resp = array(
    'done' => false,
    'errorMsg' => 'Ошибка доступа!'
  );

  exit( json_encode($resp) );
}


if ( isset( $_POST['action'] ) ) {
  $action = $_POST['action'];
  unset($_POST['action']);
  $data = $_POST;
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
        updateLogo($_FILES['logo']);
    break;

  case 'updateMain':
        updateMain($data);
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

  exit(json_encode($resp));
}

function updateLogo($logoFile) {
  if ( $logoFile['size'] > 2097152) {
    $resp = array(
      'done' => false,
      'errorMsg' => 'Файл слишком большой!'
    );
  } else {
    $logoPath = '../../img/logo.png';
    unlink($logoPath);
    move_uploaded_file($logoFile['tmp_name'], '../../img/logo.png');

    $resp = array(
      'done' => true,
      'successMsg' => 'Логотип заведения обновлен'
    );
  }

   exit(json_encode($resp));
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

        exit(json_encode($resp));
      }

      if ($key == 'org_name' && ($value == '' || strlen($value) > 20) ) {
        $resp = array(
          'done' => false,
          'errorMsg' => 'Некорректное название заведения!'
        );

        exit(json_encode($resp));
      }
    }
  }

  global $pdo;

  $newSettings['org_name'] = trim($newSettings['org_name']);

  validate($newSettings);

  $stmt = $pdo->prepare("INSERT INTO settings (name, value)
               VALUES ('first_cost',:first_cost), ('next_cost',:next_cost), ('org_name',:org_name), ('stop_check',:stop_check)
               ON DUPLICATE KEY UPDATE value = VALUES(value)");

  $stmt->execute($newSettings);

  $resp = array(
    'done' => true,
    'successMsg' => 'Общие настройки обновлены'
  );

   exit(json_encode($resp));
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
    'successMsg' => 'Информация о скидках обновлена'
  );

   exit(json_encode($resp));

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
    'successMsg' => 'Пользователь удален'
  );

   exit(json_encode($resp));
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
    'successMsg' => 'Информация о пользователях обновлена'
  );

  exit(json_encode($resp));
}

?>
