import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ChatInboxState = {
  /** Total unread messages across conversations for the logged-in admin (GET /chat/unread → data.messages). */
  unreadMessages: number
}

const initialState: ChatInboxState = {
  unreadMessages: 0,
}

const chatInboxSlice = createSlice({
  name: 'chatInbox',
  initialState,
  reducers: {
    setChatUnreadMessages: (state, action: PayloadAction<number>) => {
      const n = Number(action.payload)
      state.unreadMessages = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
    },
  },
})

export const { setChatUnreadMessages } = chatInboxSlice.actions
export default chatInboxSlice.reducer
