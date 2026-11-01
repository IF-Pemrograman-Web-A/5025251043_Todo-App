<?php
$page = ($_GET["page"] ?? "") === "shared" ? "shared" : "personal";
?>
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>

    <meta name="theme-color" content="#2563eb">
    <meta name="description" content="A todo list app that keeps working offline.">
    <link rel="manifest" href="manifest.json">
    <link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
    <link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="Todo">

    <link rel="stylesheet" href="style.css">
</head>

<body data-scope="<?= $page ?>">
    <a href="#main" class="skip-link">Skip to content</a>

    <header>
        <h1>Todo List</h1>

        <div class="header-actions">
            <button id="install-button" type="button" hidden>
                Install App
            </button>

            <button id="theme-toggle" type="button" aria-pressed="false">
                Dark Mode
            </button>
        </div>
    </header>

    <p id="offline-banner" class="offline-banner" role="status" hidden>
        Kamu sedang offline. Menampilkan data terakhir yang tersimpan.
    </p>

    <div class="layout">
        <?php include "menu-bar.php"; ?>

        <main id="main">
            <?php include "content.php"; ?>
        </main>
    </div>

    <footer>
        <p>Todo List</p>
        <p>
            <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn (opens in new tab)"
            >LinkedIn</a>
            |
            <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram (opens in new tab)"
            >Instagram</a>
        </p>
    </footer>

    <script src="script.js"></script>
</body>
</html>