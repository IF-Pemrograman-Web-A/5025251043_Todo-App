<nav class="sidebar" aria-label="Menu">
    <ul>
        <li>
            <a href="index.php?page=personal"<?= $page === "personal" ? ' aria-current="page"' : "" ?>>Personal</a>
        </li>
        <li>
            <a href="index.php?page=shared"<?= $page === "shared" ? ' aria-current="page"' : "" ?>>Shared</a>
        </li>
    </ul>
</nav>