import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import clusterReducer from './slices/clusterSlice'
import podReducer from './slices/podSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        clusters: clusterReducer,
        pods: podReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['auth/login/fulfilled', 'auth/register/fulfilled'],
            },
        }),
})

// Infer types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
