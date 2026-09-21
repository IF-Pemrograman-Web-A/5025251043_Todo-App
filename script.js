const todoContainer = document.querySelector("#todo-container");
const todoDetail = document.querySelector(".todo-detail");
const todoForm = document.querySelector("#todo-form");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const dueDateInput = document.querySelector("#due-date");
const themeToggle = document.querySelector("#theme-toggle");

let todos = [
    {
        title: "Belajar HTML",
        description: "Mempelajari struktur dasar HTML.",
        dueDate: "2026-09-21",
        completed: false
    },

    {
        title: "Belajar CSS",
        description: "Membuat tampilan website dengan CSS.",
        dueDate: "2026-09-22",
        completed: false
    },

    {
        title: "Mengerjakan Tugas",
        description: "Menyelesaikan tugas Todo List.",
        dueDate: "2026-09-23",
        completed: false
    }
];

let selectedTodo = null;

function addTodoEvent(todo, todoItem){
    const checkbox = todoItem.querySelector("input[type='checkbox']");

    todoItem.addEventListener(
        "click",
        function(event){
            if (event.target.type === "checkbox")
                return;

            selectedTodo = todo;
            showTodoDetail(todo);
        }
    );

    checkbox.addEventListener(
        "change",
        function(event){
            event.stopPropagation();

            todo.completed = checkbox.checked;
            renderTodos();

            if (selectedTodo === todo)
                showTodoDetail(todo);
        }
    );
}

function showTodoDetail(todo){
    let status;
    if (todo.completed)
        status = "Completed";
    else
        status = "In progress";

    let dueDate = "No due date";

    if (todo.dueDate)
        dueDate = todo.dueDate;

    todoDetail.innerHTML = `
        <h2>Todo Detail</h2>

        <span class="due-date">Due: ${dueDate}</span>
        <h3>${todo.title}</h3>
        <p>${todo.description}</p>
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
            value="${todo.title}"
        >

        <label for="edit-description">Description</label>
        <textarea
            id="edit-description"
            >${todo.description}
        </textarea>

        <label for="edit-due-date">Due Date</label>

        <input
            type="date"
            id="edit-due-date"
            value="${todo.dueDate}"
        >

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

    document
        .querySelector("#save-button")
        .addEventListener(
            "click",
            function(){
                if(editTitle.value === "" || editDescription.value === ""){
                    alert("Title dan Description harus diisi.");
                    return;
                }

                todo.title = editTitle.value;
                todo.description = editDescription.value;
                todo.dueDate = editDueDate.value;

                renderTodos();
                showTodoDetail(todo);
            }
        );

    document
        .querySelector("#cancel-button")
        .addEventListener(
            "click",
            function(){
                showTodoDetail(todo);
            }
        );
}

function deleteTodo(todo){
    const confirmDelete = confirm("Apakah kamu yakin ingin menghapus todo ini?");

    if (!confirmDelete)
        return;

    const index = todos.indexOf(todo);

    if (index !== -1)
        todos.splice(index, 1);

    selectedTodo = null;

    renderTodos();

    todoDetail.innerHTML = `
        <h2>Todo Detail</h2>
        <div class="empty-detail">
            <p>Pilih todo untuk melihat detail.</p>
        </div>
    `;
}

function renderTodos(){
    todoContainer.innerHTML = "";

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

    sortedTodos.forEach(
        function(todo){
            const todoItem = document.createElement("div");

            todoItem.classList.add("todo-item");

            if (todo.completed)
                todoItem.classList.add("completed");

            todoItem.innerHTML = `
                <input
                    type="checkbox"
                    ${todo.completed ? "checked" : ""}
                >

                <div class="todo-content">
                    <h3>${todo.title}</h3>
                </div>
            `;

            todoContainer.appendChild(todoItem);

            addTodoEvent(
                todo,
                todoItem
            );
        }
    );
}

todoForm.addEventListener(
    "submit",
    function(event){
        event.preventDefault();

        const title = titleInput.value;
        const description = descriptionInput.value;
        const dueDate = dueDateInput.value;

        if(title === "" || description === ""){
            alert("Title dan Description harus diisi.");
            return;
        }

        const newTodo = {
            title: title,
            description: description,
            dueDate: dueDate,
            completed: false
        };

        todos.push(newTodo);
        renderTodos();
        todoForm.reset();
    }
);

themeToggle.addEventListener(
    "click",
    function(){
        document.body.classList.toggle("dark-mode");
        if(document.body.classList.contains("dark-mode"))
            themeToggle.textContent = "Light Mode";
        else
            themeToggle.textContent = "Dark Mode";
    }
);

renderTodos();