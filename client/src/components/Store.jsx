import { create } from 'zustand';

// Update the store configuration
export const userAuth = create((set) => ({
    user: null,
    allDocs: [],
    loading: true,

    fetchUser: async () => {
        try {
            const response = await fetch('/validate', {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                set({ user: data?.user?.id, loading: false });
            } else {
                set({ user: null, loading: false });
            }
        } catch (error) {
            set({ user: null, loading: false });
        }
    },

    setUser: (userId) => set({user : userId}),
    setDocs: (docs) => set({ allDocs: docs }),

    // Add this new action
    removeDoc: (docId) =>
        set(state => ({
            allDocs: state.allDocs.filter(doc => doc.id !== docId)
        })),

    logout: async () => {
        try {
            const response = await fetch('/sign-out', { 
                method: 'GET', 
                credentials: 'include' 
            });
            
            if (!response.ok) throw new Error('Logout failed');
            
            set({ user: null, allDocs: [] }); // Clear all user data
        } catch (err) {
            console.error("Logout error:", err);
            throw err; // Re-throw to handle in component
        }
    }
}));