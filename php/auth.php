<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

switch ($action) {
    case 'register':
        $fullName = $input['fullName'] ?? '';
        $email = $input['email'] ?? '';
        $phone = $input['phone'] ?? '';
        $password = $input['password'] ?? '';
        $role = $input['role'] ?? 'client';

        if (!$fullName || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs obligatoires.']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé.']);
            exit;
        }

        $nameParts = explode(' ', $fullName, 2);
        $firstName = $nameParts[0];
        $lastName = $nameParts[1] ?? '';
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $id = bin2hex(random_bytes(16));

        $stmt = $pdo->prepare('INSERT INTO users (id, first_name, last_name, email, phone, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())');
        $stmt->execute([$id, $firstName, $lastName, $email, $phone, $hashedPassword, $role]);

        if ($role === 'tailor') {
            $specialty = $input['specialty'] ?? '';
            $city = $input['city'] ?? '';
            $yearsExperience = intval($input['yearsExperience'] ?? 0);
            $bio = $input['bio'] ?? '';
            $siret = $input['siret'] ?? '';
            $companyName = $input['companyName'] ?? '';
            $artisanId = bin2hex(random_bytes(16));

            $stmt = $pdo->prepare('INSERT INTO artisans (id, user_id, first_name, last_name, email, phone, specialty, city, status, siret, company_name, years_experience, bio, subscription_plan, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
            $stmt->execute([$artisanId, $id, $firstName, $lastName, $email, $phone, $specialty, $city, 'En attente', $siret, $companyName, $yearsExperience, $bio, 'Starter', 'En attente']);
        }

        $_SESSION['userId'] = $id;

        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $id,
                'firstName' => $firstName,
                'lastName' => $lastName,
                'email' => $email,
                'role' => $role,
            ]
        ]);
        break;

    case 'login':
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';

        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Email ou mot de passe incorrect.']);
            exit;
        }

        $_SESSION['userId'] = $user['id'];

        echo json_encode([
            'success' => true,
            'role' => $user['role'],
            'user' => [
                'id' => $user['id'],
                'firstName' => $user['first_name'],
                'lastName' => $user['last_name'],
                'email' => $user['email'],
                'role' => $user['role'],
            ]
        ]);
        break;

    case 'user':
        if (!isset($_SESSION['userId'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Non authentifié.']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id, first_name, last_name, email, role, profile_image_url FROM users WHERE id = ?');
        $stmt->execute([$_SESSION['userId']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable.']);
            exit;
        }

        echo json_encode([
            'id' => $user['id'],
            'firstName' => $user['first_name'],
            'lastName' => $user['last_name'],
            'email' => $user['email'],
            'role' => $user['role'],
            'profileImageUrl' => $user['profile_image_url'],
        ]);
        break;

    case 'logout':
        session_destroy();
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Action non reconnue.']);
        break;
}
