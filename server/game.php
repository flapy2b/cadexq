<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Configuration du serveur

// Load configuration from config.ini
$config = parse_ini_file(__DIR__ . '/../config.ini');
define('SERVER_URL', $config['url']);

// Chemin vers le fichier de données
$dataDir = __DIR__ . '/../data/';

// Vérifier si le dossier data existe
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Gérer les différentes actions
$action = $_POST['action'] ?? '';

switch ($action) {
    case 'create_game':
        createGame();
        break;
    case 'join_game':
        joinGame();
        break;
    case 'add_line':
        addLine();
        break;
    case 'end_game':
        endGame();
        break;
    case 'delete_game':
        deleteGame();
        break;
    case 'get_game_state':
        getGameState();
        break;
    default:
        echo json_encode(['error' => 'Action invalide']);
        break;
}

function endGame() {
    global $dataDir;
    
    $gameCode = $_POST['game_code'] ?? '';
    $playerName = $_POST['player_name'] ?? '';
    
    if (empty($gameCode) || empty($playerName)) {
        echo json_encode(['error' => 'Code de partie et nom du joueur requis']);
        return;
    }
    
    $gameFile = $dataDir . "game_{$gameCode}.json";
    
    if (!file_exists($gameFile)) {
        echo json_encode(['error' => 'Partie introuvable']);
        return;
    }
    
    $gameData = json_decode(file_get_contents($gameFile), true);
    
    // Vérifier si le joueur fait partie de la partie
    if (!in_array($playerName, $gameData['players'])) {
        echo json_encode(['error' => 'Joueur non autorisé']);
        return;
    }
    
    // Terminer la partie
    $gameData['status'] = 'ended';
    file_put_contents($gameFile, json_encode($gameData, JSON_PRETTY_PRINT));
    
    echo json_encode(['success' => true]);
}

function deleteGame() {
    global $dataDir;
    
    $gameCode = $_POST['game_code'] ?? '';
    $playerName = $_POST['player_name'] ?? '';
    
    if (empty($gameCode) || empty($playerName)) {
        echo json_encode(['error' => 'Code de partie et nom du joueur requis']);
        return;
    }
    
    $gameFile = $dataDir . "game_{$gameCode}.json";
    
    if (!file_exists($gameFile)) {
        echo json_encode(['error' => 'Partie introuvable']);
        return;
    }
    
    $gameData = json_decode(file_get_contents($gameFile), true);
    
    // Vérifier si le joueur fait partie de la partie
    if (!in_array($playerName, $gameData['players'])) {
        echo json_encode(['error' => 'Joueur non autorisé']);
        return;
    }
    
    // Supprimer le fichier de la partie
    unlink($gameFile);
    
    echo json_encode(['success' => true]);
}

function createGame() {
    global $dataDir;
    
    $playerName = $_POST['player_name'] ?? '';
    
    if (empty($playerName)) {
        echo json_encode(['error' => 'Nom du joueur requis']);
        return;
    }
    
    // Générer un code à 3 chiffres
    $gameCode = str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
    $gameFile = $dataDir . "game_{$gameCode}.json";
    
    // Vérifier si le code existe déjà
    while (file_exists($gameFile)) {
        $gameCode = str_pad(rand(0, 999), 3, '0', STR_PAD_LEFT);
        $gameFile = $dataDir . "game_{$gameCode}.json";
    }
    
    // Créer la structure de la partie
    $gameData = [
        'code' => $gameCode,
        'players' => [$playerName],
        'lines' => [],
        'current_player_index' => 0,
        'status' => 'waiting'
    ];
    
    // Changer le statut en "playing" si la partie commence avec au moins 2 joueurs
    if (count($gameData['players']) >= 2) {
        $gameData['status'] = 'playing';
    }
    
    file_put_contents($gameFile, json_encode($gameData, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'game_code' => $gameCode,
        'player_name' => $playerName
    ]);
}

function joinGame() {
    global $dataDir;
    
    $gameCode = $_POST['game_code'] ?? '';
    $playerName = $_POST['player_name'] ?? '';
    
    if (empty($gameCode) || empty($playerName)) {
        echo json_encode(['error' => 'Code de partie et nom du joueur requis']);
        return;
    }
    
    $gameFile = $dataDir . "game_{$gameCode}.json";
    
    if (!file_exists($gameFile)) {
        echo json_encode(['error' => 'Partie introuvable']);
        return;
    }
    
    $gameData = json_decode(file_get_contents($gameFile), true);
    
    // Vérifier si le joueur existe déjà
    if (in_array($playerName, $gameData['players'])) {
        echo json_encode(['error' => 'Nom déjà utilisé dans cette partie']);
        return;
    }
    
    // Ajouter le joueur
    $gameData['players'][] = $playerName;
    
    // Si c'est le deuxième joueur, passer en mode "playing"
    if (count($gameData['players']) >= 2 && $gameData['status'] === 'waiting') {
        $gameData['status'] = 'playing';
    }
    
    file_put_contents($gameFile, json_encode($gameData, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'game_code' => $gameCode,
        'player_name' => $playerName
    ]);
}

function addLine() {
    global $dataDir;
    
    $gameCode = $_POST['game_code'] ?? '';
    $playerName = $_POST['player_name'] ?? '';
    $line = $_POST['line'] ?? '';
    
    if (empty($gameCode) || empty($playerName) || empty($line)) {
        echo json_encode(['error' => 'Tous les champs sont requis']);
        return;
    }
    
    $gameFile = $dataDir . "game_{$gameCode}.json";
    
    if (!file_exists($gameFile)) {
        echo json_encode(['error' => 'Partie introuvable']);
        return;
    }
    
    $gameData = json_decode(file_get_contents($gameFile), true);
    
    // Vérifier si le joueur est autorisé à jouer
    $currentPlayer = $gameData['players'][$gameData['current_player_index']];
    if ($playerName !== $currentPlayer) {
        echo json_encode(['error' => 'Ce n\'est pas votre tour']);
        return;
    }
    
    // Ajouter la ligne
    $gameData['lines'][] = [
        'player' => $playerName,
        'text' => $line
    ];
    
    // Passer au joueur suivant
    $nextIndex = ($gameData['current_player_index'] + 1) % count($gameData['players']);
    $gameData['current_player_index'] = $nextIndex;
    
    file_put_contents($gameFile, json_encode($gameData, JSON_PRETTY_PRINT));
    
    echo json_encode([
        'success' => true,
        'next_player' => $gameData['players'][$nextIndex],
        'status' => $gameData['status']
    ]);
}

function getGameState() {
    global $dataDir;
    
    $gameCode = $_POST['game_code'] ?? '';
    $playerName = $_POST['player_name'] ?? '';
    
    if (empty($gameCode) || empty($playerName)) {
        echo json_encode(['error' => 'Code de partie et nom du joueur requis']);
        return;
    }
    
    $gameFile = $dataDir . "game_{$gameCode}.json";
    
    if (!file_exists($gameFile)) {
        echo json_encode(['error' => 'Partie introuvable']);
        return;
    }
    
    $gameData = json_decode(file_get_contents($gameFile), true);
    
    // Vérifier si le joueur fait partie de la partie
    if (!in_array($playerName, $gameData['players'])) {
        echo json_encode(['error' => 'Joueur non autorisé']);
        return;
    }
    
    // Obtenir le dernier mot écrit
    $lastWord = '';
    if (!empty($gameData['lines'])) {
        $lastLine = end($gameData['lines']);
        $words = explode(' ', $lastLine['text']);
        $lastWord = end($words);
    }
    
    echo json_encode([
        'success' => true,
        'players' => $gameData['players'],
        'lines' => $gameData['lines'],
        'current_player' => $gameData['players'][$gameData['current_player_index']],
        'is_my_turn' => $playerName === $gameData['players'][$gameData['current_player_index']],
        'last_word' => $lastWord,
        'status' => $gameData['status']
    ]);
}

?>