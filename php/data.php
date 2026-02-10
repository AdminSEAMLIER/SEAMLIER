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

$route = $_GET['route'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
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
    echo json_encode(['error' => 'Erreur de connexion à la base de données.']);
    exit;
}

$parts = explode('/', trim($route, '/'));
$resource = $parts[0] ?? '';
$id = $parts[1] ?? null;
$subResource = $parts[2] ?? null;

switch ($resource) {
    case 'tailors':
        if ($id && $subResource === 'portfolio') {
            $stmt = $pdo->prepare('SELECT * FROM portfolio_items WHERE tailor_id = ?');
            $stmt->execute([$id]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } elseif ($id && $subResource === 'products') {
            $stmt = $pdo->prepare('SELECT * FROM products WHERE tailor_id = ?');
            $stmt->execute([$id]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } elseif ($id && $subResource === 'reviews') {
            $stmt = $pdo->prepare('SELECT * FROM reviews WHERE tailor_id = ?');
            $stmt->execute([$id]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } elseif ($id) {
            $stmt = $pdo->prepare('SELECT t.*, u.first_name, u.last_name, u.email, u.profile_image_url FROM tailors t LEFT JOIN users u ON t.user_id = u.id WHERE t.id = ?');
            $stmt->execute([$id]);
            $tailor = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($tailor ?: null);
        } else {
            $stmt = $pdo->query('SELECT t.*, u.first_name, u.last_name, u.email, u.profile_image_url FROM tailors t LEFT JOIN users u ON t.user_id = u.id');
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        break;

    case 'products':
        if ($id) {
            $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC) ?: null);
        } else {
            $stmt = $pdo->query('SELECT * FROM products ORDER BY created_at DESC');
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        break;

    case 'portfolio':
        $stmt = $pdo->query('SELECT p.*, t.id as tailor_id FROM portfolio_items p LEFT JOIN tailors t ON p.tailor_id = t.id ORDER BY p.created_at DESC');
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'conversations':
        if (!isset($_SESSION['userId'])) {
            http_response_code(401);
            echo json_encode([]);
            exit;
        }
        $stmt = $pdo->prepare('SELECT * FROM conversations WHERE user1_id = ? OR user2_id = ? ORDER BY updated_at DESC');
        $stmt->execute([$_SESSION['userId'], $_SESSION['userId']]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'messages':
        if ($method === 'POST') {
            $conversationId = $input['conversationId'] ?? '';
            $content = $input['content'] ?? '';
            $senderId = $_SESSION['userId'] ?? '';
            $msgId = bin2hex(random_bytes(16));
            $stmt = $pdo->prepare('INSERT INTO messages (id, conversation_id, sender_id, content, created_at) VALUES (?, ?, ?, ?, NOW())');
            $stmt->execute([$msgId, $conversationId, $senderId, $content]);
            echo json_encode(['success' => true, 'id' => $msgId]);
        } elseif ($id) {
            $stmt = $pdo->prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC');
            $stmt->execute([$id]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        break;

    case 'measurements':
        if ($method === 'POST') {
            $userId = $_SESSION['userId'] ?? '';
            $mId = bin2hex(random_bytes(16));
            $stmt = $pdo->prepare('INSERT INTO measurements (id, user_id, data, created_at) VALUES (?, ?, ?, NOW())');
            $stmt->execute([$mId, $userId, json_encode($input)]);
            echo json_encode(['success' => true, 'id' => $mId]);
        }
        break;

    case 'user':
        if ($parts[1] === 'me') {
            if (!isset($_SESSION['userId'])) {
                http_response_code(401);
                echo json_encode(null);
                exit;
            }
            if ($method === 'PATCH') {
                $fields = [];
                $values = [];
                $mapping = ['firstName' => 'first_name', 'lastName' => 'last_name', 'phone' => 'phone', 'location' => 'location'];
                foreach ($mapping as $jsKey => $dbCol) {
                    if (isset($input[$jsKey])) {
                        $fields[] = "$dbCol = ?";
                        $values[] = $input[$jsKey];
                    }
                }
                if (!empty($fields)) {
                    $values[] = $_SESSION['userId'];
                    $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
                    $pdo->prepare($sql)->execute($values);
                }
                echo json_encode(['success' => true]);
            } elseif ($subResource === 'tailor') {
                if ($method === 'POST') {
                    $tId = bin2hex(random_bytes(16));
                    $stmt = $pdo->prepare('INSERT INTO tailors (id, user_id, specialty, bio, years_experience, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
                    $stmt->execute([$tId, $_SESSION['userId'], $input['specialty'] ?? '', $input['bio'] ?? '', $input['yearsExperience'] ?? 0]);
                    echo json_encode(['success' => true, 'id' => $tId]);
                }
            } else {
                $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
                $stmt->execute([$_SESSION['userId']]);
                echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
            }
        }
        break;

    case 'pro':
        $subRoute = $parts[1] ?? '';
        if ($subRoute === 'conversations') {
            if (!isset($_SESSION['userId'])) {
                echo json_encode([]);
                exit;
            }
            $stmt = $pdo->prepare('SELECT * FROM conversations WHERE user1_id = ? OR user2_id = ? ORDER BY updated_at DESC');
            $stmt->execute([$_SESSION['userId'], $_SESSION['userId']]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } elseif ($subRoute === 'requests') {
            echo json_encode([]);
        } elseif ($subRoute === 'projects') {
            echo json_encode([]);
        }
        break;

    case 'users':
        if ($id && $method === 'PATCH') {
            $fields = [];
            $values = [];
            $mapping = ['firstName' => 'first_name', 'lastName' => 'last_name', 'phone' => 'phone', 'location' => 'location', 'profileImageUrl' => 'profile_image_url'];
            foreach ($mapping as $jsKey => $dbCol) {
                if (isset($input[$jsKey])) {
                    $fields[] = "$dbCol = ?";
                    $values[] = $input[$jsKey];
                }
            }
            if (!empty($fields)) {
                $values[] = $id;
                $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
                $pdo->prepare($sql)->execute($values);
            }
            echo json_encode(['success' => true]);
        }
        break;

    case 'create-checkout-session':
        echo json_encode(['success' => false, 'message' => 'Paiement non configuré.']);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Route non trouvée: ' . $route]);
        break;
}
