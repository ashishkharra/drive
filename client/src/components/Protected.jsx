import { Navigate } from 'react-router-dom';
import { userAuth } from './Store';
import Loading from './Loading';

const Protected = ({ element }) => {
    const { user, loading } = userAuth();
    if (loading) {
        return <div className='flex justify-center items-center min-h-screen'><Loading /></div>;
    }
    return user ? element : <Navigate to="/" replace state={{ message: 'Please log in' }} />;
};
export default Protected;