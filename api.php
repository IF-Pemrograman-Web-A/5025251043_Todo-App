<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key");

function fail($status, $message, $details = null, $headers = []){
    http_response_code($status);
    foreach ($headers as $header) {
        header($header);
    }
    $payload = ["error" => $message];
    if ($details !== null) {
        $payload["details"] = $details;
    }
    echo json_encode($payload);
    exit;
}

function bearerOrKey(){
    if (!empty($_SERVER["HTTP_X_API_KEY"])) {
        return trim($_SERVER["HTTP_X_API_KEY"]);
    }
    $header = $_SERVER["HTTP_AUTHORIZATION"] ?? $_SERVER["REDIRECT_HTTP_AUTHORIZATION"] ?? "";
    if (stripos($header, "Bearer ") === 0) {
        return trim(substr($header, 7));
    }
    return "";
}

function authenticate(){
    $key = bearerOrKey();
    if ($key === "") {
        fail(401, "API key diperlukan.", null, ["WWW-Authenticate: Bearer realm=\"todo-api\""]);
    }
    if (!hash_equals(API_KEY, $key)) {
        fail(403, "API key tidak valid.");
    }
}

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
    $method = $_SERVER["REQUEST_METHOD"];
    $type = $_SERVER["CONTENT_TYPE"] ?? "";
    $isJson = stripos($type, "application/json") !== false;

    if ($isJson) {
        $raw = file_get_contents("php://input");
        if (trim($raw) === "") {
            return [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            fail(400, "Body JSON tidak valid.");
        }
        return $data;
    }

    if ($method === "POST") {
        return $_POST;
    }

    if ($method === "PUT" || $method === "PATCH") {
        fail(415, "Content-Type harus application/json.");
    }

    return [];
}

function textLength($text){
    return function_exists("mb_strlen") ? mb_strlen($text) : strlen($text);
}

function validDate($value){
    $date = DateTime::createFromFormat("Y-m-d", $value);
    return $date && $date->format("Y-m-d") === $value;
}

function validDateTime($value){
    $date = DateTime::createFromFormat("Y-m-d\TH:i", $value);
    if ($date && $date->format("Y-m-d\TH:i") === $value) {
        return true;
    }
    $date = DateTime::createFromFormat("Y-m-d H:i:s", $value);
    return $date && $date->format("Y-m-d H:i:s") === $value;
}

function validate($body, $partial){
    $errors = [];

    foreach (["title", "description"] as $field) {
        if (!array_key_exists($field, $body)) {
            if (!$partial) {
                $errors[$field] = "Wajib diisi.";
            }
            continue;
        }
        if (!is_string($body[$field]) || trim($body[$field]) === "") {
            $errors[$field] = "Wajib diisi.";
        } elseif ($field === "title" && textLength(trim($body[$field])) > 255) {
            $errors[$field] = "Maksimal 255 karakter.";
        }
    }

    if (!empty($body["dueDate"]) && (!is_string($body["dueDate"]) || !validDate($body["dueDate"]))) {
        $errors["dueDate"] = "Format harus YYYY-MM-DD.";
    }

    if (!empty($body["notifyTime"]) && (!is_string($body["notifyTime"]) || !validDateTime($body["notifyTime"]))) {
        $errors["notifyTime"] = "Format harus YYYY-MM-DDTHH:MM.";
    }

    foreach (["notified", "completed"] as $field) {
        if (isset($body[$field]) && !in_array($body[$field], [0, 1, "0", "1", true, false], true)) {
            $errors[$field] = "Harus berupa boolean.";
        }
    }

    if (isset($body["scope"]) && !in_array($body["scope"], ["personal", "shared"], true)) {
        $errors["scope"] = "Harus personal atau shared.";
    }

    if ($errors) {
        fail(422, "Data tidak valid.", $errors);
    }
}

function parseId($segment){
    if (!ctype_digit($segment) || (int)$segment <= 0) {
        fail(400, "ID todo tidak valid.");
    }
    return (int)$segment;
}

function findTodo($pdo, $id){
    $stmt = $pdo->prepare("SELECT * FROM todos WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        fail(404, "Todo tidak ditemukan.");
    }
    return $row;
}

function saveImage(){
    if (!isset($_FILES["image"]) || $_FILES["image"]["error"] === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    $error = $_FILES["image"]["error"];
    if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
        fail(413, "Ukuran gambar terlalu besar.");
    }
    if ($error !== UPLOAD_ERR_OK) {
        fail(400, "Upload gambar gagal.");
    }
    $info = @getimagesize($_FILES["image"]["tmp_name"]);
    if ($info === false) {
        fail(422, "Data tidak valid.", ["image" => "File harus berupa gambar."]);
    }
    if (!is_dir("uploads")) {
        mkdir("uploads", 0777, true);
    }
    $name = uniqid() . "." . image_type_to_extension($info[2], false);
    move_uploaded_file($_FILES["image"]["tmp_name"], "uploads/" . $name);
    return $name;
}

function listTodos($pdo){
    $scope = $_GET["scope"] ?? "personal";
    if (!in_array($scope, ["personal", "shared"], true)) {
        fail(422, "Data tidak valid.", ["scope" => "Harus personal atau shared."]);
    }
    $stmt = $pdo->prepare("SELECT * FROM todos WHERE scope = ? ORDER BY id");
    $stmt->execute([$scope]);
    echo json_encode(array_map("toTodo", $stmt->fetchAll()));
}

function showTodo($pdo, $id){
    echo json_encode(toTodo(findTodo($pdo, $id)));
}

function createTodo($pdo, $body){
    validate($body, false);
    $image = saveImage();
    $stmt = $pdo->prepare(
        "INSERT INTO todos (title, description, due_date, notify_time, notified, completed, image, scope) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        trim($body["title"]),
        trim($body["description"]),
        ($body["dueDate"] ?? "") ?: null,
        ($body["notifyTime"] ?? "") ?: null,
        (int)($body["notified"] ?? 0),
        (int)($body["completed"] ?? 0),
        $image,
        ($body["scope"] ?? "") === "shared" ? "shared" : "personal"
    ]);
    $newId = (int)$pdo->lastInsertId();
    http_response_code(201);
    header("Location: " . $_SERVER["SCRIPT_NAME"] . "/todos/" . $newId);
    showTodo($pdo, $newId);
}

function replaceTodo($pdo, $id, $body){
    findTodo($pdo, $id);
    validate($body, false);
    $stmt = $pdo->prepare(
        "UPDATE todos SET title = ?, description = ?, due_date = ?, notify_time = ?, notified = ?, completed = ? WHERE id = ?"
    );
    $stmt->execute([
        trim($body["title"]),
        trim($body["description"]),
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
    $allowed = ["title", "description", "dueDate", "notifyTime", "notified", "completed"];
    if (!array_intersect(array_keys($body), $allowed)) {
        fail(400, "Body kosong atau tidak memiliki field yang bisa diubah.");
    }
    validate($body, true);
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
    showTodo($pdo, $id);
}

function deleteTodo($pdo, $id){
    $row = findTodo($pdo, $id);
    if ($row["image"]) {
        @unlink("uploads/" . basename($row["image"]));
    }
    $stmt = $pdo->prepare("DELETE FROM todos WHERE id = ?");
    $stmt->execute([$id]);
    http_response_code(204);
}

try {
    require "config.php";
    require "auth.php";

    $method = $_SERVER["REQUEST_METHOD"];

    if ($method === "OPTIONS") {
        http_response_code(204);
        exit;
    }

    authenticate();

    $segments = array_values(array_filter(explode("/", $_SERVER["PATH_INFO"] ?? ""), "strlen"));

    if (count($segments) === 0 || $segments[0] !== "todos" || count($segments) > 2) {
        fail(404, "Endpoint tidak ditemukan.");
    }

    $isCollection = count($segments) === 1;
    $allowed = $isCollection ? ["GET", "POST"] : ["GET", "PUT", "PATCH", "DELETE"];

    if (!in_array($method, $allowed, true)) {
        fail(405, "Metode " . $method . " tidak didukung pada endpoint ini.", null, ["Allow: " . implode(", ", $allowed) . ", OPTIONS"]);
    }

    $id = $isCollection ? 0 : parseId($segments[1]);
    $body = ($method === "GET" || $method === "DELETE") ? [] : readBody();

    if ($method === "GET" && $isCollection) {
        listTodos($pdo);
    } elseif ($method === "GET") {
        showTodo($pdo, $id);
    } elseif ($method === "POST") {
        createTodo($pdo, $body);
    } elseif ($method === "PUT") {
        replaceTodo($pdo, $id, $body);
    } elseif ($method === "PATCH") {
        patchTodo($pdo, $id, $body);
    } else {
        deleteTodo($pdo, $id);
    }
} catch (PDOException $e) {
    error_log($e->getMessage());
    fail(500, "Terjadi kesalahan pada server.");
}
