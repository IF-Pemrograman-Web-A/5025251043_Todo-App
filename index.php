<?php
$page = ($_GET["page"] ?? "") === "shared" ? "shared" : "personal";
?>
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>
    <link rel="stylesheet" href="style.css">
</head>

<body data-scope="<?= $page ?>">
    <a href="#main" class="skip-link">Skip to content</a>

    <header>
        <h1>Todo List</h1>

        <button id="theme-toggle" type="button" aria-pressed="false">
            Dark Mode
        </button>
    </header>

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