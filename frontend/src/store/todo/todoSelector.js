import { createSelector } from "@reduxjs/toolkit";

export const selectTodos = (state) => state.todo.items;

export const selectPendingTodos = createSelector(
  [selectTodos],
  (items) => items.filter((item) => !item.isCompleted)
);

export const selectCompletedTodos = createSelector(
  [selectTodos],
  (items) => items.filter((item) => item.isCompleted)
);

export const selectTodoCount = (state) => state.todo.items.length;

export const selectPendingTodoCount = createSelector(
  [selectTodos],
  (items) => items.filter((item) => !item.isCompleted).length
);