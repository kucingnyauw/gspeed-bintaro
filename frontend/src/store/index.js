import { configureStore, combineReducers } from "@reduxjs/toolkit";

import authSlices from "@store/auth/authSlices.js";
import sidebarSlices from "@store/sidebar/sidebarSlices.js";
import themeSlices from "@store/theme/themeSlices.js";
import cartSlices from "@store/cart/cartSlices.js";
import notificationsSlice from "@store/notifications/notificationsSlice.js";
import todoSlices from "@store/todo/todoSlices.js";


const rootReducer = combineReducers({
  auth: authSlices,
  sidebar: sidebarSlices,
  theme : themeSlices ,
  cart : cartSlices ,
  notification : notificationsSlice ,
  todo : todoSlices,
 
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;