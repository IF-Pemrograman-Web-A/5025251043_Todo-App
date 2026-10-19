const todoContainer = document.querySelector("#todo-container");
const todoDetail = document.querySelector(".todo-detail");
const todoForm = document.querySelector("#todo-form");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const dueDateInput = document.querySelector("#due-date");
const notifyTimeInput = document.querySelector("#notify-time");
const imageInput = document.querySelector("#image-input");
const openCameraButton = document.querySelector("#open-camera");
const takePhotoButton = document.querySelector("#take-photo");
const cameraPreview = document.querySelector("#camera-preview");
const imagePreview = document.querySelector("#image-preview");
const photoCanvas = document.querySelector("#photo-canvas");
const formError = document.querySelector("#form-error");
const formStatus = document.querySelector("#form-status");
const listHeading = document.querySelector("#list-heading");
const themeToggle = document.querySelector("#theme-toggle");

const scope = document.body.dataset.scope;

let todos = [];

let selectedTodo = null;

let imageBlob = null;

let stream = null;

let previewUrl = null;

let swReg = null;

function escapeHTML(text){
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatNotifyTime(value){
    return new Date(value).toLocaleString("id-ID");
}

function addTodoEvent(todo, todoItem){
    const checkbox = todoItem.querySelector("input[type='checkbox']");
    const content = todoItem.querySelector(".todo-content");

    function selectTodo(){
        selectedTodo = todo;
        showTodoDetail(todo, true);
    }

    todoItem.addEventListener(
        "click",
        function(event){
            if (event.target.type === "checkbox")
                return;

            selectTodo();
        }
    );

    content.addEventListener(
        "keydown",
        function(event){
            if (event.key === "Enter" || event.key === " "){
                event.preventDefault();
                selectTodo();
            }
        }
    );

    checkbox.addEventListener(
        "change",
        function(event){
            event.stopPropagation();

            todo.completed = checkbox.checked;
            saveTodo(todo);
            renderTodos(todo);

            if (selectedTodo === todo)
                showTodoDetail(todo, false);
        }
    );
}

function showTodoDetail(todo, moveFocus){
    let status;
    if (todo.completed)
        status = "Completed";
    else
        status = "In progress";

    let dueDate = "No due date";

    if (todo.dueDate)
        dueDate = todo.dueDate;

    let notifyTime = "";

    if (todo.notifyTime)
        notifyTime = `<p class="notify-time">Reminder: ${escapeHTML(formatNotifyTime(todo.notifyTime))}</p>`;

    let image = "";

    if (todo.image)
        image = `<img
            class="detail-image"
            src="uploads/${escapeHTML(todo.image)}"
            alt="Gambar untuk todo: ${escapeHTML(todo.title)}"
        >`;

    todoDetail.innerHTML = `
        <h2>Todo Detail</h2>

        <span class="due-date">Due: ${escapeHTML(dueDate)}</span>
        <h3 id="detail-title" tabindex="-1">${escapeHTML(todo.title)}</h3>
        <p>${escapeHTML(todo.description)}</p>
        ${notifyTime}
        ${image}
        <p class="status">Status: ${status}</p>

        <div class="detail-buttons">
            <button
                type="button"
                id="delete-button"
            >
                Delete
            </button>

            <button
                type="button"
                id="edit-button"
            >
                Edit
            </button>
        </div>
    `;

    if (moveFocus)
        document.querySelector("#detail-title").focus();

    document
        .querySelector("#edit-button")
        .addEventListener(
            "click",
            function(){
                editTodo(todo);
            }
        );

    document
        .querySelector("#delete-button")
        .addEventListener(
            "click",
            function(){
                deleteTodo(todo);
            }
        );
}

function editTodo(todo) {
    todoDetail.innerHTML = `
        <h2>Edit Todo</h2>
        <label for="edit-title">Title</label>
        <input
            type="text"
            id="edit-title"
            value="${escapeHTML(todo.title)}"
            required
            aria-required="true"
            aria-describedby="edit-error"
        >

        <label for="edit-description">Description</label>
        <textarea
            id="edit-description"
            required
            aria-required="true"
            aria-describedby="edit-error"
        >${escapeHTML(todo.description)}</textarea>

        <label for="edit-due-date">Due Date</label>

        <input
            type="date"
            id="edit-due-date"
            value="${escapeHTML(todo.dueDate || "")}"
        >

        <label for="edit-notify-time">Notification Time</label>

        <input
            type="datetime-local"
            id="edit-notify-time"
            value="${escapeHTML(todo.notifyTime || "")}"
        >

        <p id="edit-error" class="error-message" role="alert"></p>

        <div class="detail-buttons">
            <button
                type="button"
                id="cancel-button"
            >
                Cancel
            </button>

            <button
                type="button"
                id="save-button"
            >
                Save
            </button>
        </div>
    `;

    const editTitle = document.querySelector("#edit-title");
    const editDescription = document.querySelector("#edit-description");
    const editDueDate = document.querySelector("#edit-due-date");
    const editNotifyTime = document.querySelector("#edit-notify-time");
    const editError = document.querySelector("#edit-error");

    editTitle.focus();

    document
        .querySelector("#save-button")
        .addEventListener(
            "click",
            function(){
                if(editTitle.value.trim() === "" || editDescription.value.trim() === ""){
                    editError.textContent = "Title dan Description harus diisi.";

                    if(editTitle.value.trim() === "")
                        editTitle.focus();
                    else
                        editDescription.focus();

                    return;
                }

                if(editNotifyTime.value !== todo.notifyTime){
                    todo.notified = false;

                    if(editNotifyTime.value)
                        requestNotificationPermission();
                }

                todo.title = editTitle.value.trim();
                todo.description = editDescription.value.trim();
                todo.dueDate = editDueDate.value;
                todo.notifyTime = editNotifyTime.value;

                saveTodo(todo);
                renderTodos();
                showTodoDetail(todo, true);
            }
        );

    document
        .querySelector("#cancel-button")
        .addEventListener(
            "click",
            function(){
                showTodoDetail(todo, true);
            }
        );
}

async function deleteTodo(todo){
    const confirmDelete = confirm("Apakah kamu yakin ingin menghapus todo ini?");

    if (!confirmDelete)
        return;

    const index = todos.indexOf(todo);

    if (index !== -1)
        todos.splice(index, 1);

    if (todo.id !== undefined)
        await removeTodo(todo.id);

    selectedTodo = null;

    renderTodos();

    todoDetail.innerHTML = `
        <h2>Todo Detail</h2>
        <div class="empty-detail">
            <p>Pilih todo untuk melihat detail.</p>
        </div>
    `;

    const firstTodo = todoContainer.querySelector(".todo-content");

    if (firstTodo)
        firstTodo.focus();
    else
        listHeading.focus();
}

function renderTodos(focusTodo){
    todoContainer.innerHTML = "";

    if (todos.length === 0){
        todoContainer.innerHTML = `
            <p class="empty-list">Belum ada todo. Tambahkan todo pertamamu.</p>
        `;
        return;
    }

    const unfinishedTodos = todos.filter(
        function(todo){
            return !todo.completed;
        }
    );

    const completedTodos = todos.filter(
        function(todo){
            return todo.completed;
        }
    );

    const sortedTodos = unfinishedTodos.concat(completedTodos);

    let focusTarget = null;

    sortedTodos.forEach(
        function(todo){
            const todoItem = document.createElement("div");

            todoItem.classList.add("todo-item");

            if (todo.completed)
                todoItem.classList.add("completed");

            todoItem.innerHTML = `
                <input
                    type="checkbox"
                    aria-label="Tandai selesai: ${escapeHTML(todo.title)}"
                    ${todo.completed ? "checked" : ""}
                >

                <div
                    class="todo-content"
                    role="button"
                    tabindex="0"
                >
                    <h3>${escapeHTML(todo.title)}</h3>
                </div>
            `;

            todoContainer.appendChild(todoItem);

            addTodoEvent(
                todo,
                todoItem
            );

            if (todo === focusTodo)
                focusTarget = todoItem.querySelector("input[type='checkbox']");
        }
    );

    if (focusTarget)
        focusTarget.focus();
}

function showPreview(blob){
    if (previewUrl)
        URL.revokeObjectURL(previewUrl);

    previewUrl = URL.createObjectURL(blob);
    imagePreview.src = previewUrl;
    imagePreview.hidden = false;
}

function resetImage(){
    imageBlob = null;
    imageInput.value = "";
    imagePreview.hidden = true;
    imagePreview.removeAttribute("src");

    if (previewUrl){
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    stopCamera();
}

function stopCamera(){
    if (stream){
        stream.getTracks().forEach(
            function(track){
                track.stop();
            }
        );
        stream = null;
    }

    cameraPreview.srcObject = null;
    cameraPreview.hidden = true;
    takePhotoButton.hidden = true;
}

openCameraButton.addEventListener(
    "click",
    async function(){
        formError.textContent = "";

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
            formError.textContent = "Kamera tidak didukung. Gunakan upload file.";
            return;
        }

        try{
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraPreview.srcObject = stream;
            cameraPreview.hidden = false;
            takePhotoButton.hidden = false;
            takePhotoButton.focus();
        }
        catch(error){
            formError.textContent = "Kamera tidak dapat diakses. Gunakan upload file.";
        }
    }
);

takePhotoButton.addEventListener(
    "click",
    function(){
        photoCanvas.width = cameraPreview.videoWidth;
        photoCanvas.height = cameraPreview.videoHeight;
        photoCanvas.getContext("2d").drawImage(cameraPreview, 0, 0);

        photoCanvas.toBlob(
            function(blob){
                imageBlob = blob;
                showPreview(blob);
                formStatus.textContent = "Foto berhasil diambil.";
            },
            "image/jpeg",
            0.8
        );

        stopCamera();
        openCameraButton.focus();
    }
);

imageInput.addEventListener(
    "change",
    function(){
        imageBlob = imageInput.files[0] || null;

        if (imageBlob)
            showPreview(imageBlob);
        else
            imagePreview.hidden = true;
    }
);

todoForm.addEventListener(
    "submit",
    async function(event){
        event.preventDefault();

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        const dueDate = dueDateInput.value;
        const notifyTime = notifyTimeInput.value;

        formStatus.textContent = "";

        if(title === "" || description === ""){
            formError.textContent = "Title dan Description harus diisi.";

            titleInput.setAttribute("aria-invalid", title === "");
            descriptionInput.setAttribute("aria-invalid", description === "");

            if(title === "")
                titleInput.focus();
            else
                descriptionInput.focus();

            return;
        }

        formError.textContent = "";
        titleInput.removeAttribute("aria-invalid");
        descriptionInput.removeAttribute("aria-invalid");

        if(notifyTime)
            requestNotificationPermission();

        const newTodo = {
            title: title,
            description: description,
            dueDate: dueDate,
            notifyTime: notifyTime,
            notified: false,
            image: null,
            completed: false
        };

        try{
            await saveTodo(newTodo, imageBlob);
        }
        catch(error){
            formError.textContent = "Todo gagal disimpan. Coba lagi.";
            return;
        }

        todos.push(newTodo);
        renderTodos();

        todoForm.reset();
        resetImage();

        formStatus.textContent = "Todo berhasil ditambahkan.";
        titleInput.focus();
    }
);

function applyTheme(theme){
    document.body.classList.toggle("dark-mode", theme === "dark");

    if(theme === "dark")
        themeToggle.textContent = "Light Mode";
    else
        themeToggle.textContent = "Dark Mode";

    themeToggle.setAttribute("aria-pressed", theme === "dark");
}

applyTheme(localStorage.getItem("theme") || "light");

themeToggle.addEventListener(
    "click",
    function(){
        let nextTheme = "dark";

        if(document.body.classList.contains("dark-mode"))
            nextTheme = "light";

        localStorage.setItem("theme", nextTheme);
        applyTheme(nextTheme);
    }
);

async function init(){
    try{
        todos = await getTodos();
    }
    catch(error){
        console.error("Gagal memuat todo:", error);
    }

    renderTodos();
    checkNotifications();
}

init();

async function saveTodo(todo, imageFile){
    const data = new FormData();

    data.append("id", todo.id || "");
    data.append("title", todo.title);
    data.append("description", todo.description);
    data.append("dueDate", todo.dueDate);
    data.append("notifyTime", todo.notifyTime);
    data.append("notified", todo.notified ? 1 : 0);
    data.append("completed", todo.completed ? 1 : 0);
    data.append("scope", scope);

    if (imageFile)
        data.append("image", imageFile, "photo.jpg");

    const response = await fetch("api.php?action=save", {
        method: "POST",
        body: data
    });

    if (!response.ok)
        throw new Error("Gagal menyimpan todo");

    const saved = await response.json();

    todo.id = saved.id;

    if (saved.image)
        todo.image = saved.image;

    return todo;
}

async function removeTodo(id){
    const data = new FormData();

    data.append("id", id);

    const response = await fetch("api.php?action=delete", {
        method: "POST",
        body: data
    });

    if (!response.ok)
        throw new Error("Gagal menghapus todo");
}

async function getTodos(){
    const response = await fetch("api.php?action=list&scope=" + scope);

    if (!response.ok)
        throw new Error("Gagal memuat todo");

    return response.json();
}

if ("serviceWorker" in navigator){
    navigator.serviceWorker
        .register("sw.js")
        .then(function(registration){
            swReg = registration;
        })
        .catch(function(error){
            console.error("Service Worker gagal didaftarkan:", error);
        });
}

function requestNotificationPermission(){
    if ("Notification" in window && Notification.permission === "default")
        Notification.requestPermission();
}

function showReminder(todo){
    const options = {
        body: todo.title,
        tag: "todo-" + todo.id
    };

    if (swReg)
        swReg.showNotification("Todo Reminder", options);
    else
        new Notification("Todo Reminder", options);
}

function checkNotifications(){
    if (!("Notification" in window) || Notification.permission !== "granted")
        return;

    const now = Date.now();

    todos.forEach(
        function(todo){
            if (
                todo.notifyTime &&
                !todo.notified &&
                !todo.completed &&
                new Date(todo.notifyTime).getTime() <= now
            ){
                showReminder(todo);
                todo.notified = true;
                saveTodo(todo);
            }
        }
    );
}

setInterval(checkNotifications, 30000);