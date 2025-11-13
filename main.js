$(document).ready(() => {
    const $inputElement = $('#todo-input');
    const $addButton = $('#add-todo');
    const $todoListElement = $('#todo-list');
    let savedTodos = JSON.parse(localStorage.getItem('todos')) || [];
    let undoStack = []; // ここで削除されたタスクを一時的に保存するための配列

    const saveTodos = (todos) => localStorage.setItem('todos', JSON.stringify(todos));

    const renderTodos = () => {
        $todoListElement.empty();

        const activeTodos = savedTodos.filter(todo => !todo.pending);
        const pendingTodos = savedTodos.filter(todo => todo.pending);
        const allTodos = [...activeTodos, ...pendingTodos];

        allTodos.forEach((todo, index) => {
            const $li = $('<li>')
                .addClass(todo.completed ? 'completed' : '')
                .addClass(todo.pending ? 'pending' : '')
                .attr({ draggable: true, 'data-index': index })
                .html(`
                    <div class="drag-handle"></div>
                    <span class="todo-text">${todo.text}</span>
                    <input class="edit-input" type="text" value="${todo.text}" style="display:none;">
                    <button class="toggle-pending">${todo.pending ? '保留中' : '保留'}</button>
                    <button class="edit-todo"><img src="img/pen.png" alt="Edit" class="edit-icon"></button>
                    <button class="delete-todo">削除</button>
                `);
            $todoListElement.append($li);

            // タスクを保留にするボタンのクリックイベント
            $li.find('.toggle-pending').on('click', () => {
                todo.pending = !todo.pending;
                updateTodoOrder();
                saveTodos(savedTodos);
                renderTodos();
            });

            // 編集ボタンのクリックイベント
            $li.find('.edit-todo').on('click', () => {
                $li.find('.todo-text').hide();
                $li.find('.edit-input').show().focus();
                $li.attr('draggable', false);
            });

            // 編集終了時のイベント
            $li.find('.edit-input').on('blur keypress', function (e) {
                if (e.type === 'blur' || e.key === 'Enter') {
                    const newText = $(this).val().trim();
                    if (newText) {
                        todo.text = newText;
                        saveTodos(savedTodos);
                        renderTodos();
                    } else {
                        $(this).hide();
                        $li.find('.todo-text').show();
                    }
                    $li.attr('draggable', true);
                }
            });

            // 削除ボタンのクリックイベント
            $li.find('.delete-todo').on('click', () => {
                undoStack.push({ todo: savedTodos[index], index }); // 削除前にundoStackに保存
                savedTodos = savedTodos.filter((_, i) => i !== index);
                saveTodos(savedTodos);
                renderTodos();
            });

            // ドラッグ＆ドロップのイベント
            $li.on('dragstart', (e) => {
                e.originalEvent.dataTransfer.effectAllowed = 'move';
                e.originalEvent.dataTransfer.setData('text/plain', index.toString());
                $(e.currentTarget).addClass('dragging');
            }).on('dragover', (e) => {
                e.preventDefault();
                e.originalEvent.dataTransfer.dropEffect = 'move';
            }).on('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.originalEvent.dataTransfer.getData('text/plain'));
                const toIndex = parseInt($(e.currentTarget).data('index'));
                if (fromIndex !== toIndex && !isNaN(fromIndex) && !isNaN(toIndex)) {
                    const item = savedTodos.splice(fromIndex, 1)[0];
                    savedTodos.splice(toIndex, 0, item);
                    saveTodos(savedTodos);
                    renderTodos();
                }
                $(e.currentTarget).removeClass('dragging');
            }).on('dragend', () => {
                $('.dragging').removeClass('dragging');
            });
        });
    };

    // タスクの順序を更新
    const updateTodoOrder = () => {
        const activeTodos = savedTodos.filter(todo => !todo.pending);
        const pendingTodos = savedTodos.filter(todo => todo.pending);
        savedTodos = [...activeTodos, ...pendingTodos];
    };

    // 新しいタスクを追加
    const addTodo = () => {
        const text = $inputElement.val().trim();
        if (text) {
            savedTodos.unshift({ text, completed: false, pending: false });
            saveTodos(savedTodos);
            renderTodos();
            $inputElement.val('');
        }
    };

    $addButton.on('click', addTodo);
    $inputElement.on('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // Ctrl+Z (または Cmd+Z) のキーイベントを監視
    $(document).on('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            if (undoStack.length > 0) {
                const lastDeleted = undoStack.pop(); // undoStackから最後に削除されたタスクを取得
                savedTodos.splice(lastDeleted.index, 0, lastDeleted.todo); // 元の位置に戻す
                saveTodos(savedTodos);
                renderTodos();
            }
        }
    });

    renderTodos();
});
