import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "workshop_quick_todos";

const save = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Gagal menyimpan To-Do ke localStorage:", err);
  }
};

const loadTodosFromLocalStorage = () => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) return [];
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Gagal memuat To-Do dari localStorage:", err);
    return [];
  }
};

const initialState = {
  items: loadTodosFromLocalStorage(),
};

const todoSlice = createSlice({
  name: "todo",
  initialState,
  reducers: {
    addTodo: (state, action) => {
      state.items.unshift({
        id: crypto.randomUUID(),
        text: action.payload,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      });
      save(state.items);
    },

    toggleTodoStatus: (state, action) => {
      const todo = state.items.find((item) => item.id === action.payload);
      if (todo) {
        todo.isCompleted = !todo.isCompleted;
        save(state.items);
      }
    },

    deleteTodo: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      save(state.items);
    },

    clearCompletedTodos: (state) => {
      state.items = state.items.filter((item) => !item.isCompleted);
      save(state.items);
    },
  },
});

export const {
  addTodo,
  toggleTodoStatus,
  deleteTodo,
  clearCompletedTodos,
} = todoSlice.actions;

export default todoSlice.reducer;

