import React, { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Loading from './components/Loading';
import Register from './components/Register.jsx'
import Home from './components/Home.jsx';
import Protected from './components/Protected.jsx';
import Error from './components/Error.jsx';
import { userAuth } from './components/Store.jsx';

const AllDocs = lazy(() => import('./components/AllDocs.jsx'));
const Editor = lazy(() => import('./components/Editor.jsx'));

const App = () => {
  const userId = userAuth(state => state.user);
  useEffect(() => {
    userAuth.getState().fetchUser();
  },[userId]);
  return (
    <div>
      <BrowserRouter basename='/'>
        <Suspense fallback={<div className="flex h-96 justify-center items-center"><Loading /></div>}>
          <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/editor" element={<Protected element={<Home />} />} />
            <Route path="/your-docs" element={<Protected element={<AllDocs />} />} />
            <Route path="/update-doc/:docId" element={<Protected element={<Editor />} />} />
            <Route path="*" element={<Error />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </div>
  )
}

export default App