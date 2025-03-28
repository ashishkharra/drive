import React from "react";
import OAuth from "./OAuth";

const Register = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-gray-900 to-gray-700 p-4">
      <div className="relative w-full md:w-[600px] max-w-full min-h-[400px] bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome</h2>
            <p className="text-sm text-gray-600">Sign in or sign up with Google</p>
          </div>
          <OAuth />
        </div>

        <div className="absolute top-0 right-0 w-full md:w-1/2 h-1/4 md:h-full overflow-hidden z-50">
          <div className="h-full bg-gradient-to-r from-orange-600 to-orange-700 text-white flex flex-col items-center justify-center px-6 py-8 text-center">
            <h2 className="text-xl font-bold mb-3">Join Us Today!</h2>
            <p className="text-xs md:text-sm leading-tight">
              Sign in or sign up using Google for a seamless experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;