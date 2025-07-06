document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const taskInput = document.getElementById('newTaskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const taskDueDate = document.getElementById('taskDueDate');
    const taskDueTime = document.getElementById('taskDueTime');
    const taskCategory = document.getElementById('taskCategory');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const taskFilter = document.getElementById('taskFilter');
    const taskSort = document.getElementById('taskSort');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const categoryList = document.getElementById('categoryList');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const todaysEvents = document.getElementById('todaysEvents');
    const currentDay = document.getElementById('currentDay');
    const currentDate = document.getElementById('currentDate');
    const editModal = document.getElementById('editModal');
    const categoryModal = document.getElementById('categoryModal');
    const themeToggle = document.getElementById('themeToggle');
    
    // Modal elements
    const editTaskTitle = document.getElementById('editTaskTitle');
    const editTaskDescription = document.getElementById('editTaskDescription');
    const editTaskDueDate = document.getElementById('editTaskDueDate');
    const editTaskDueTime = document.getElementById('editTaskDueTime');
    const editTaskCategory = document.getElementById('editTaskCategory');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const newCategoryName = document.getElementById('newCategoryName');
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    
    // State variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || ['personal', 'work', 'shopping'];
    let currentEditTaskId = null;
    
    // Initialize the app
    init();
    
    function init() {
        // Set current date
        updateCurrentDate();
        
        // Set default due date to today
        const today = new Date().toISOString().split('T')[0];
        taskDueDate.value = today;
        
        // Ensure categories are strings (migration step)
        if (categories.some(cat => typeof cat !== 'string')) {
            categories = categories.map(cat => {
                if (typeof cat === 'object') return cat.name || '';
                return String(cat);
            }).filter(cat => cat.trim() !== '');
            saveCategories();
        }
        
        // Load categories
        loadCategories();
        
        // Load tasks
        renderTasks();
        
        // Set up event listeners
        setupEventListeners();
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.checked = savedTheme === 'dark';
    }
    
    function updateCurrentDate() {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        currentDay.textContent = days[now.getDay()];
        currentDate.textContent = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }
    
    function loadCategories() {
        // Clear existing categories (except "All Tasks")
        while (categoryList.children.length > 1) {
            categoryList.removeChild(categoryList.lastChild);
        }
        
        // Add categories from storage
        categories.forEach(category => {
            const catName = String(category).trim();
            if (!catName || catName.charAt(0) === '...') return;
            
            const li = document.createElement('li');
            li.textContent = catName.charAt(0).toUpperCase() + catName.slice(1);
            li.dataset.category = catName;
            categoryList.appendChild(li);
        });
        
        updateCategorySelects();
    }
    
    function updateCategorySelects() {
        // Clear existing options
        while (taskCategory.options.length > 0) {
            taskCategory.remove(0);
        }
        
        while (editTaskCategory.options.length > 0) {
            editTaskCategory.remove(0);
        }
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select Category';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        taskCategory.appendChild(defaultOption.cloneNode(true));
        editTaskCategory.appendChild(defaultOption.cloneNode(true));
        
        // Add categories to selects
        categories.forEach(category => {
            const catName = String(category).trim();
            if (!catName) return;
            
            const option = document.createElement('option');
            option.value = catName;
            option.textContent = catName.charAt(0).toUpperCase() + catName.slice(1);
            taskCategory.appendChild(option.cloneNode(true));
            editTaskCategory.appendChild(option.cloneNode(true));
        });
    }
    
    function setupEventListeners() {
        // Add task
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        // Task actions
        taskList.addEventListener('click', handleTaskActions);
        
        // Clear completed tasks
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        
        // Filter and sort tasks
        taskFilter.addEventListener('change', renderTasks);
        taskSort.addEventListener('change', renderTasks);
        
        // Category selection
        categoryList.addEventListener('click', function(e) {
            if (e.target.tagName === 'LI') {
                document.querySelectorAll('#categoryList li').forEach(li => {
                    li.classList.remove('active');
                });
                e.target.classList.add('active');
                renderTasks();
            }
        });
        
        // Add category
        addCategoryBtn.addEventListener('click', function() {
            categoryModal.style.display = 'flex';
            newCategoryName.value = '';
            newCategoryName.focus();
        });
        
        // Theme toggle
        themeToggle.addEventListener('change', function() {
            const theme = this.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
        
        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });
        
        // Save edited task
        saveEditBtn.addEventListener('click', saveEditedTask);
        
        // Save new category
        saveCategoryBtn.addEventListener('click', addNewCategory);
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }
    
    function addTask() {
        const title = taskInput.value.trim();
        if (!title) {
            alert('Please enter a task title');
            taskInput.focus();
            return;
        }
        
        const task = {
            id: Date.now().toString(),
            title,
            description: '',
            dueDate: taskDueDate.value,
            dueTime: taskDueTime.value || '',
            category: taskCategory.value || categories[0] || 'personal',
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(task);
        saveTasks();
        renderTasks();
        
        // Reset input
        taskInput.value = '';
        taskInput.focus();
    }
    
    function renderTasks() {
        // Get filter and sort values
        const filter = taskFilter.value;
        const sort = taskSort.value;
        const activeCategory = document.querySelector('#categoryList li.active')?.dataset.category || 'all';
        
        // Filter tasks
        let filteredTasks = [...tasks];
        
        // Apply category filter
        if (activeCategory !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === activeCategory);
        }
        
        // Apply status filter
        switch (filter) {
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.completed);
                break;
            case 'pending':
                filteredTasks = filteredTasks.filter(task => !task.completed);
                break;
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredTasks = filteredTasks.filter(task => task.dueDate === today);
                break;
            case 'overdue':
                const now = new Date();
                filteredTasks = filteredTasks.filter(task => {
                    if (!task.dueDate || task.completed) return false;
                    const dueDate = new Date(task.dueDate);
                    return dueDate < now && dueDate.toISOString().split('T')[0] !== now.toISOString().split('T')[0];
                });
                break;
        }
        
        // Sort tasks
        filteredTasks.sort((a, b) => {
            switch (sort) {
                case 'dueDate':
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'creationDate':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'category':
                    return (a.category || '').localeCompare(b.category || '');
                default:
                    return 0;
            }
        });
        
        // Render tasks
        taskList.innerHTML = filteredTasks.length ? '' : '<p class="no-events">No tasks found</p>';
        
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item';
            taskItem.dataset.id = task.id;
            
            if (task.completed) taskItem.classList.add('completed');
            
            // Check task status
            if (task.dueDate && !task.completed) {
                const today = new Date();
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(23, 59, 59);
                
                if (dueDate < today) {
                    taskItem.classList.add('overdue');
                } else if (dueDate.toDateString() === today.toDateString()) {
                    taskItem.classList.add('due-today');
                }
            }
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        <span class="task-category">${task.category || 'Uncategorized'}</span>
                        ${task.dueDate ? `
                            <span class="task-due">
                                <i class="far fa-calendar-alt"></i>
                                ${formatDate(task.dueDate)}
                                ${task.dueTime ? `at ${formatTime(task.dueTime)}` : ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" title="Edit task"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Delete task"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            taskList.appendChild(taskItem);
        });
        
        updateProgress();
        renderTodaysEvents();
    }
    
    function renderTodaysEvents() {
        const today = new Date().toISOString().split('T')[0];
        const todaysTasks = tasks.filter(task => task.dueDate === today && !task.completed);
        
        todaysEvents.innerHTML = todaysTasks.length ? '' : '<p class="no-events">No events scheduled for today</p>';
        
        todaysTasks.forEach(task => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            
            // Check if overdue
            if (task.dueTime) {
                const [hours, minutes] = task.dueTime.split(':').map(Number);
                const dueDateTime = new Date(task.dueDate);
                dueDateTime.setHours(hours, minutes);
                
                if (dueDateTime < new Date()) {
                    eventItem.classList.add('overdue');
                }
            }
            
            eventItem.innerHTML = `
                <div class="event-title">${task.title}</div>
                <div class="event-meta">
                    <span class="event-category">${task.category || 'Uncategorized'}</span>
                    ${task.dueTime ? `
                        <span class="event-time">
                            <i class="far fa-clock"></i>
                            ${formatTime(task.dueTime)}
                        </span>
                    ` : ''}
                </div>
            `;
            
            todaysEvents.appendChild(eventItem);
        });
    }
    
    function handleTaskActions(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        
        const taskId = taskItem.dataset.id;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        if (e.target.classList.contains('task-checkbox') || e.target.closest('.task-checkbox')) {
            // Toggle completion
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        } else if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            // Edit task
            currentEditTaskId = taskId;
            editTaskTitle.value = task.title;
            editTaskDescription.value = task.description;
            editTaskDueDate.value = task.dueDate || '';
            editTaskDueTime.value = task.dueTime || '';
            editTaskCategory.value = task.category || '';
            editModal.style.display = 'flex';
        } else if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            // Delete task
            if (confirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(t => t.id !== taskId);
                saveTasks();
                renderTasks();
            }
        }
    }
    
    function saveEditedTask() {
        const task = tasks.find(t => t.id === currentEditTaskId);
        if (!task) return;
        
        const newTitle = editTaskTitle.value.trim();
        if (!newTitle) {
            alert('Task title cannot be empty');
            return;
        }
        
        task.title = newTitle;
        task.description = editTaskDescription.value.trim();
        task.dueDate = editTaskDueDate.value;
        task.dueTime = editTaskDueTime.value;
        task.category = editTaskCategory.value || 'personal';
        
        saveTasks();
        renderTasks();
        editModal.style.display = 'none';
    }
    
    function clearCompletedTasks() {
        if (confirm('Are you sure you want to clear all completed tasks?')) {
            tasks = tasks.filter(task => !task.completed);
            saveTasks();
            renderTasks();
        }
    }
    
    function addNewCategory() {
        const categoryName = newCategoryName.value.trim();
        if (!categoryName) {
            alert('Please enter a category name');
            newCategoryName.focus();
            return;
        }
        
        // Normalize comparison (case insensitive)
        const normalizedNew = categoryName.toLowerCase();
        const exists = categories.some(cat => {
            const existingName = String(cat).toLowerCase();
            return existingName === normalizedNew;
        });
        
        if (exists) {
            alert('Category already exists');
            newCategoryName.focus();
            return;
        }
        
        categories.push(categoryName);
        saveCategories();
        loadCategories();
        
        newCategoryName.value = '';
        categoryModal.style.display = 'none';
    }
    
    function updateProgress() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${completedTasks}/${totalTasks} tasks completed`;
    }
    
    function saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } catch (e) {
            console.error('Failed to save tasks:', e);
            alert('Failed to save tasks. Your browser storage might be full.');
        }
    }
    
    function saveCategories() {
        try {
            localStorage.setItem('categories', JSON.stringify(categories));
        } catch (e) {
            console.error('Failed to save categories:', e);
            alert('Failed to save categories. Your browser storage might be full.');
        }
    }
    
    function formatDate(dateString) {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`;
    }
});