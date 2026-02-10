<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

$dbHost = 'localhost';
$dbName = 'VOTRE_BASE';
$dbUser = 'VOTRE_USER';
$dbPass = 'VOTRE_PASS';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur de connexion à la base de données.']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'artisans':
        if ($method === 'GET') {
            $stmt = $pdo->query('SELECT a.*, u.first_name, u.last_name, u.email, u.phone, u.role FROM artisans a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC');
            $artisans = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($artisans);
        } elseif ($method === 'POST') {
            $firstName = $input['firstName'] ?? '';
            $lastName = $input['lastName'] ?? '';
            $email = $input['email'] ?? '';
            $phone = $input['phone'] ?? '';
            $specialty = $input['specialty'] ?? '';
            $city = $input['city'] ?? '';
            $status = $input['status'] ?? 'En attente';
            $siret = $input['siret'] ?? '';
            $companyName = $input['companyName'] ?? '';
            $legalForm = $input['legalForm'] ?? '';
            $birthDate = $input['birthDate'] ?? '';
            $nationality = $input['nationality'] ?? '';
            $idType = $input['idType'] ?? '';
            $idNumber = $input['idNumber'] ?? '';
            $address = $input['address'] ?? '';
            $tvaNumber = $input['tvaNumber'] ?? '';
            $iban = $input['iban'] ?? '';
            $yearsExperience = $input['yearsExperience'] ?? 0;
            $bio = $input['bio'] ?? '';
            $subscriptionPlan = $input['subscriptionPlan'] ?? 'Starter';
            $paymentStatus = $input['paymentStatus'] ?? 'En attente';

            $id = bin2hex(random_bytes(16));

            $stmt = $pdo->prepare('INSERT INTO artisans (id, first_name, last_name, email, phone, specialty, city, status, siret, company_name, legal_form, birth_date, nationality, id_type, id_number, address, tva_number, iban, years_experience, bio, subscription_plan, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
            $stmt->execute([$id, $firstName, $lastName, $email, $phone, $specialty, $city, $status, $siret, $companyName, $legalForm, $birthDate, $nationality, $idType, $idNumber, $address, $tvaNumber, $iban, $yearsExperience, $bio, $subscriptionPlan, $paymentStatus]);

            echo json_encode(['success' => true, 'id' => $id]);
        }
        break;

    case 'artisan':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID manquant.']);
            exit;
        }

        if ($method === 'PUT') {
            $fields = [];
            $values = [];
            $mapping = [
                'firstName' => 'first_name', 'lastName' => 'last_name', 'email' => 'email',
                'phone' => 'phone', 'specialty' => 'specialty', 'city' => 'city',
                'status' => 'status', 'siret' => 'siret', 'companyName' => 'company_name',
                'legalForm' => 'legal_form', 'birthDate' => 'birth_date', 'nationality' => 'nationality',
                'idType' => 'id_type', 'idNumber' => 'id_number', 'address' => 'address',
                'tvaNumber' => 'tva_number', 'iban' => 'iban', 'yearsExperience' => 'years_experience',
                'bio' => 'bio', 'subscriptionPlan' => 'subscription_plan', 'paymentStatus' => 'payment_status',
            ];
            foreach ($mapping as $jsKey => $dbCol) {
                if (isset($input[$jsKey])) {
                    $fields[] = "$dbCol = ?";
                    $values[] = $input[$jsKey];
                }
            }
            if (!empty($fields)) {
                $values[] = $id;
                $sql = 'UPDATE artisans SET ' . implode(', ', $fields) . ' WHERE id = ?';
                $pdo->prepare($sql)->execute($values);
            }
            echo json_encode(['success' => true]);
        } elseif ($method === 'DELETE') {
            $pdo->prepare('DELETE FROM artisans WHERE id = ?')->execute([$id]);
            echo json_encode(['success' => true]);
        }
        break;

    case 'settings':
        if ($method === 'GET') {
            $stmt = $pdo->query('SELECT setting_key, setting_value FROM settings');
            $settings = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
            echo json_encode($settings);
        } elseif ($method === 'POST') {
            foreach ($input as $key => $value) {
                $stmt = $pdo->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?');
                $stmt->execute([$key, $value, $value]);
            }
            echo json_encode(['success' => true]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Action non reconnue.']);
        break;
}
