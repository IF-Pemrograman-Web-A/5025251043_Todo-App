<?php
require "config.php";

header("Content-Type: application/json");

function fail($message){
    http_response_code(400);
    echo json_encode(["error" => $message]);
    exit;
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
        "completed" => (bool)$row["completed"]
    ];
}

$action = $_GET["action"] ?? "";
$isPost = $_SERVER["REQUEST_METHOD"] === "POST";

if ($action === "list"){
    $scope = ($_GET["scope"] ?? "") === "shared" ? "shared" : "personal";

    $stmt = $pdo->prepare("SELECT * FROM todos WHERE scope = ? ORDER BY id");
    $stmt->execute([$scope]);

    echo json_encode(array_map("toTodo", $stmt->fetchAll()));
}
elseif ($action === "save" && $isPost){
    $id = (int)($_POST["id"] ?? 0);
    $title = trim($_POST["title"] ?? "");
    $description = trim($_POST["description"] ?? "");
    $dueDate = ($_POST["dueDate"] ?? "") ?: null;
    $notifyTime = ($_POST["notifyTime"] ?? "") ?: null;
    $notified = (int)($_POST["notified"] ?? 0);
    $completed = (int)($_POST["completed"] ?? 0);
    $scope = ($_POST["scope"] ?? "") === "shared" ? "shared" : "personal";

    if ($title === "" || $description === "")
        fail("Title dan Description harus diisi.");

    $image = null;

    if (isset($_FILES["image"]) && $_FILES["image"]["error"] === UPLOAD_ERR_OK){
        $info = getimagesize($_FILES["image"]["tmp_name"]);

        if ($info === false)
            fail("File harus berupa gambar.");

        $image = uniqid() . "." . image_type_to_extension($info[2], false);
        move_uploaded_file($_FILES["image"]["tmp_name"], "uploads/" . $image);
    }

    if ($id){
        $stmt = $pdo->prepare(
            "UPDATE todos SET title = ?, description = ?, due_date = ?, notify_time = ?, notified = ?, completed = ? WHERE id = ?"
        );
        $stmt->execute([$title, $description, $dueDate, $notifyTime, $notified, $completed, $id]);
    }
    else{
        $stmt = $pdo->prepare(
            "INSERT INTO todos (title, description, due_date, notify_time, notified, completed, image, scope) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$title, $description, $dueDate, $notifyTime, $notified, $completed, $image, $scope]);
        $id = $pdo->lastInsertId();
    }

    echo json_encode(["id" => (int)$id, "image" => $image]);
}
elseif ($action === "delete" && $isPost){
    $id = (int)($_POST["id"] ?? 0);

    $stmt = $pdo->prepare("SELECT image FROM todos WHERE id = ?");
    $stmt->execute([$id]);
    $image = $stmt->fetchColumn();

    if ($image)
        @unlink("uploads/" . basename($image));

    $stmt = $pdo->prepare("DELETE FROM todos WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(["success" => true]);
}
else{
    fail("Request tidak valid.");
}