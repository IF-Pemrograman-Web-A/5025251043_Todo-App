<?php
require "config.php";

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key");

function toTodo($row){
    return [
        "id" => (int)$row["id"],
        "title" => $row["title"],
        "description" => $row["description"],
        "dueDate" => $row["due_date"] ?? "",
        "notifyTime" => $row["notify_time"] ? str_replace(" ", "T", substr($row["notify_time"], 0, 16)) : "",
        "notified" => (bool)$row["notified"],
        "image" => $row["image"],
        "completed" => (bool)$row["completed"],
        "scope" => $row["scope"] ?? "personal"
    ];
}

function readBody(){
    $type = $_SERVER["CONTENT_TYPE"] ?? "";
    if (stripos($type, "application/json") !== false) {
        $data = json_decode(file_get_contents("php://input"), true);
        return is_array($data) ? $data : [];
    }
    if ($_SERVER["REQUEST_METHOD"] === "POST") {
        return $_POST;
    }
    parse_str(file_get_contents("php://input"), $data);
    return $data;
}

function findTodo($pdo, $id){
    $stmt = $pdo->prepare("SELECT * FROM todos WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function saveImage(){
    if (!isset($_FILES["image"]) || $_FILES["image"]["error"] !== UPLOAD_ERR_OK) {
        return null;
    }
    $info = getimagesize($_FILES["image"]["tmp_name"]);
    if ($info === false) {
        return null;
    }
    if (!is_dir("uploads")) {
        mkdir("uploads", 0777, true);
    }
    $name = uniqid() . "." . image_type_to_extension($info[2], false);
    move_uploaded_file($_FILES["image"]["tmp_name"], "uploads/" . $name);
    return $name;
}

function listTodos($pdo){
    $scope = ($_GET["scope"] ?? "") === "shared" ? "shared" : "personal";
    $stmt = $pdo->prepare("SELECT * FROM todos WHERE scope = ? ORDER BY id");
    $stmt->execute([$scope]);
    echo json_encode(array_map("toTodo", $stmt->fetchAll()));
}

function showTodo($pdo, $id){
    $row = findTodo($pdo, $id);
    echo json_encode($row ? toTodo($row) : null);
}

function createTodo($pdo, $body){
    $scope = ($body["scope"] ?? "") === "shared" ? "shared" : "personal";
    $stmt = $pdo->prepare(
        "INSERT INTO todos (title, description, due_date, notify_time, notified, completed, image, scope) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        trim($body["title"] ?? ""),
        trim($body["description"] ?? ""),
        ($body["dueDate"] ?? "") ?: null,
        ($body["notifyTime"] ?? "") ?: null,
        (int)($body["notified"] ?? 0),
        (int)($body["completed"] ?? 0),
        saveImage(),
        $scope
    ]);
    showTodo($pdo, (int)$pdo->lastInsertId());
}

function replaceTodo($pdo, $id, $body){
    $stmt = $pdo->prepare(
        "UPDATE todos SET title = ?, description = ?, due_date = ?, notify_time = ?, notified = ?, completed = ? WHERE id = ?"
    );
    $stmt->execute([
        trim($body["title"] ?? ""),
        trim($body["description"] ?? ""),
        ($body["dueDate"] ?? "") ?: null,
        ($body["notifyTime"] ?? "") ?: null,
        (int)($body["notified"] ?? 0),
        (int)($body["completed"] ?? 0),
        $id
    ]);
    showTodo($pdo, $id);
}

function patchTodo($pdo, $id, $body){
    $existing = findTodo($pdo, $id);
    if ($existing) {
        $title = isset($body["title"]) ? trim($body["title"]) : $existing["title"];
        $description = isset($body["description"]) ? trim($body["description"]) : $existing["description"];
        $dueDate = array_key_exists("dueDate", $body) ? ($body["dueDate"] ?: null) : $existing["due_date"];
        $notifyTime = array_key_exists("notifyTime", $body) ? ($body["notifyTime"] ?: null) : $existing["notify_time"];
        $notified = isset($body["notified"]) ? (int)$body["notified"] : (int)$existing["notified"];
        $completed = isset($body["completed"]) ? (int)$body["completed"] : (int)$existing["completed"];
        $stmt = $pdo->prepare(
            "UPDATE todos SET title = ?, description = ?, due_date = ?, notify_time = ?, notified = ?, completed = ? WHERE id = ?"
        );
        $stmt->execute([$title, $description, $dueDate, $notifyTime, $notified, $completed, $id]);
    }
    showTodo($pdo, $id);
}

function deleteTodo($pdo, $id){
    $row = findTodo($pdo, $id);
    if ($row && $row["image"]) {
        @unlink("uploads/" . basename($row["image"]));
    }
    $stmt = $pdo->prepare("DELETE FROM todos WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(["success" => true, "id" => $id]);
}

$method = $_SERVER["REQUEST_METHOD"];

if ($method === "OPTIONS") {
    exit;
}

$segments = array_values(array_filter(explode("/", $_SERVER["PATH_INFO"] ?? ""), "strlen"));
$id = (int)($segments[1] ?? 0);
$body = readBody();

if ($method === "GET" && $id === 0) {
    listTodos($pdo);
} elseif ($method === "GET") {
    showTodo($pdo, $id);
} elseif ($method === "POST") {
    createTodo($pdo, $body);
} elseif ($method === "PUT") {
    replaceTodo($pdo, $id, $body);
} elseif ($method === "PATCH") {
    patchTodo($pdo, $id, $body);
} elseif ($method === "DELETE") {
    deleteTodo($pdo, $id);
}
