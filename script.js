// DOM Elements
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const errorMessage = document.getElementById('error-message');
const filterBtns = document.querySelectorAll('.filter-btn');
const emptyState = document.getElementById('empty-state');
const dateElement = document.getElementById('current-date');

// State
let tasks = [];
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    displayDate();
    renderTasks();
});

// Display Current Date
function displayDate() {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    const today = new Date();
    dateElement.textContent = today.toLocaleDateString('en-US', options);
}

// Load Tasks from Local Storage
function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// Save Tasks to Local Storage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks();
}

// Add Task
function addTask() {
    const text = taskInput.value.trim();
    
    // Validation
    if (text === '') {
        showError('Please enter a task name');
        return;
    }

    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask); // Add to top
    saveTasks();
    
    // Reset Input
    taskInput.value = '';
    showError(''); // Clear error
    taskInput.focus();
}

// Show Error Message
function showError(msg) {
    errorMessage.textContent = msg;
    if (msg) {
        setTimeout(() => {
            errorMessage.textContent = '';
        }, 3000);
    }
}

// Render Tasks
function renderTasks() {
    taskList.innerHTML = '';
    
    // Filter Tasks
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    // Show/Hide Empty State
    if (filteredTasks.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }

    // Generate HTML
    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
            <div class="task-checkbox">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-content">${escapeHtml(task.text)}</div>
            <div class="task-actions">
                <button class="action-btn edit" title="Edit">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="action-btn delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        taskList.appendChild(li);
    });
}

// Event Listeners
addBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// Filter Buttons
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update Active Class
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update Filter State
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

// Task List Event Delegation (Click, Delete, Edit)
taskList.addEventListener('click', (e) => {
    const item = e.target.closest('.task-item');
    if (!item) return;

    const id = parseInt(item.dataset.id);

    // Toggle Complete (Clicking Checkbox or Content)
    if (e.target.closest('.task-checkbox') || e.target.closest('.task-content')) {
        // Prevent toggling if currently editing
        if (item.querySelector('.edit-input')) return;
        toggleTask(id);
    }

    // Delete Task
    if (e.target.closest('.delete')) {
        deleteTask(id);
    }

    // Edit Task
    if (e.target.closest('.edit')) {
        startEditing(id, item);
    }
});

// Toggle Task Status
function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
}

// Delete Task
function deleteTask(id) {
    if(confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
    }
}

// Start Editing
function startEditing(id, itemElement) {
    const contentDiv = itemElement.querySelector('.task-content');
    const currentText = contentDiv.innerText;

    // Create Input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'edit-input';
    
    // Replace content with input
    contentDiv.innerHTML = '';
    contentDiv.appendChild(input);
    input.focus();

    // Handle Save on Blur or Enter
    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText) {
            updateTaskText(id, newText);
        } else {
            renderTasks(); // Revert if empty
        }
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            input.removeEventListener('blur', saveEdit); // Prevent double save
            saveEdit();
        }
    });
}

// Update Task Text
function updateTaskText(id, newText) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, text: newText };
        }
        return task;
    });
    saveTasks();
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}