import React from 'react'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import app from '../../public/assets/js/firebase'
import axios from 'axios'
import { userAuth } from './Store'

const OAuth = ({ para }) => {
    const navigate = useNavigate();
    const handleClick = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const auth = getAuth(app);
            const result = await signInWithPopup(auth, provider);
    
            const res = await axios.post('/OAuth', {
                full_name: result.user.displayName,
                email: result.user.email,
            });
    
            if (res.data.success) {
                // Immediately update Zustand state
                userAuth.getState().setUser(res.data.user.id);
                
                navigate('/editor');
                alert('successfull login');
                return;
            }
        } catch (error) {
            console.log(error)
            navigate('/error', {
                state: {
                    message: error.response?.data?.message || 'Google authentication failed!',
                    type: 'error'
                }
            });
        }
    };

    return (
        <button className='bg-slate-900 text-white w-full px-4 py-2 rounded-lg mt-2 flex justify-center gap-3 items-center' onClick={handleClick}><span>{para ? 'Sign Up' : 'Sign In'} with</span>
            <img src="/assets/icons/search.png" alt="" className='w-8'/>
        </button>
    )
}

export default OAuth