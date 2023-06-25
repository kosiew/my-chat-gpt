// features/sideMenu/index.ts
import { createSlice } from "@reduxjs/toolkit";
import { SideMenuState } from "@src/features/sideMenu/types";
const initialState: SideMenuState = {
  isOpen: false,
};

export const sideMenuSlice = createSlice({
  name: "sideMenu",
  initialState,
  reducers: {
    setOpen: (state, action) => {
      state.isOpen = action.payload;
    },
  },
});

export const { setOpen } = sideMenuSlice.actions;
