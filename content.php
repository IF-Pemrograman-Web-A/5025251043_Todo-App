<div class="content">
    <section class="todo-list" aria-labelledby="list-heading">
        <h2 id="list-heading" tabindex="-1"><?= ucfirst($page) ?> Todos</h2>
        <div id="todo-container"></div>
    </section>

    <section class="todo-detail" aria-live="polite" aria-labelledby="detail-heading">
        <h2 id="detail-heading">Todo Detail</h2>
        <div class="empty-detail">
            <p>Pilih todo untuk melihat detail.</p>
        </div>
    </section>
</div>

<section class="todo-form" aria-labelledby="form-heading">
    <h2 id="form-heading">New Todo</h2>

    <form id="todo-form" novalidate>
        <label for="title">Title</label>

        <input
            type="text"
            id="title"
            name="title"
            required
            aria-required="true"
            aria-describedby="form-error"
        >

        <label for="description">Description</label>

        <textarea
            id="description"
            name="description"
            required
            aria-required="true"
            aria-describedby="form-error"
        ></textarea>

        <label for="due-date">Due Date</label>

        <input
            type="date"
            id="due-date"
            name="due-date"
        >

        <label for="notify-time">Notification Time</label>

        <input
            type="datetime-local"
            id="notify-time"
            name="notify-time"
        >

        <label for="image-input">Image</label>

        <input
            type="file"
            id="image-input"
            name="image"
            accept="image/*"
        >

        <button type="button" id="open-camera" class="secondary-button">
            Use Camera
        </button>

        <video
            id="camera-preview"
            autoplay
            playsinline
            muted
            hidden
            aria-label="Pratinjau kamera"
        ></video>

        <button type="button" id="take-photo" class="secondary-button" hidden>
            Take Photo
        </button>

        <img id="image-preview" alt="Pratinjau gambar todo" hidden>

        <canvas id="photo-canvas" hidden></canvas>

        <p id="form-error" class="error-message" role="alert"></p>
        <p id="form-status" class="status-message" role="status"></p>

        <button type="submit">Add Todo</button>
    </form>
</section>