import { configureStore } from '@reduxjs/toolkit'
import authReducer   from './authSlice'    // src/app/authSlice.js
import footerReducer from './footerSlice'
import cartReducer     from './cartSlice'
import wishlistReducer from './wishlistSlice'
import orderReducer from "./orderSlice";  // src/app/footerSlice.js
import orderDetailsReducer from "./orderDetailsSlice";
import userProfileReducer from "./userProfileSlice";
import categoryReducer from "./categorySlice";
import contentReducer from "./Contentslice";
import searchReducer from './searchSlice';
import projectContentReducer from "./projectcontentslice";

const store = configureStore({
  reducer: {
    auth:   authReducer,
    footer: footerReducer,
     cart:     cartReducer,
    wishlist: wishlistReducer,
      order: orderReducer,   // ← add this
      orderDetails: orderDetailsReducer,
      userProfile: userProfileReducer,
       categories: categoryReducer,   
        content: contentReducer,   // ← add this line
        search: searchReducer,
        projectContent: projectContentReducer,
   
  },
})

export default store
