// features/sideMenu/selectors.ts
import { RootState } from "@src/store";

export const selectIsOpen = (state: RootState) => state.sideMenu.isOpen;
