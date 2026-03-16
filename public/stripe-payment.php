<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

$STRIPE_SECRET_KEY = 'sk_test_51SvLQMLyrGmm31qYQ5lETIK5onU6ZL6Y3NqqmOKcHejTSKZYBuuCjMmnJIrQPCqAKRQC7dmzU0VtZOQUNtJcJHEg00PQl0I0U7';
$FRAIS  = 0.10;
$COMM   = 0.15;

$body = json_decode(file_get_contents('php://input'), true);
$projectId     = $body['projectId']     ?? null;
$prixConfection = (float)($body['prixConfection'] ?? 0);
$planArtisan   = strtolower($body['planArtisan'] ?? '');

if (!$projectId) {
    http_response_code(400);
    echo json_encode(['error' => 'Champ manquant : projectId']);
    exit;
}
if (!$prixConfection) {
    http_response_code(400);
    echo json_encode(['error' => 'Champ manquant : prixConfection']);
    exit;
}
if (!in_array($planArtisan, ['starter', 'pro', 'premium'])) {
    http_response_code(400);
    echo json_encode(['error' => "Plan inconnu : \"$planArtisan\" (attendu : starter, pro ou premium)"]);
    exit;
}

$frais   = round($prixConfection * $FRAIS, 2);
$total   = $prixConfection + $frais;
$comm    = ($planArtisan === 'starter') ? round($prixConfection * $COMM, 2) : 0;
$artisan = $prixConfection - $comm;

$totalCentimes   = (int)round($total * 100);
$artisanCentimes = (int)round($artisan * 100);

$postFields = http_build_query([
    'amount'                    => $totalCentimes,
    'currency'                  => 'eur',
    'description'               => "SEAMLiER - Commande #$projectId",
    'metadata[projectId]'       => $projectId,
    'metadata[planArtisan]'     => $planArtisan,
    'metadata[montantArtisan]'  => $artisanCentimes,
]);

$ch = curl_init('https://api.stripe.com/v1/payment_intents');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $STRIPE_SECRET_KEY",
    'Content-Type: application/x-www-form-urlencoded',
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => "Erreur réseau cURL : $curlError"]);
    exit;
}

$stripe = json_decode($response, true);

if ($httpCode !== 200 || !isset($stripe['client_secret'])) {
    http_response_code(500);
    $msg = $stripe['error']['message'] ?? "Réponse Stripe inattendue (HTTP $httpCode)";
    echo json_encode(['error' => $msg]);
    exit;
}

echo json_encode([
    'clientSecret' => $stripe['client_secret'],
    'montants' => [
        'prixConfection'    => $prixConfection,
        'fraisClient'       => $frais,
        'totalClient'       => $total,
        'commissionArtisan' => $comm,
        'montantArtisan'    => $artisan,
    ],
]);
