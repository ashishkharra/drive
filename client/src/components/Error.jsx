import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Error = () => {
  const location = useLocation();
  const message = location.state?.message || 'Something went wrong';

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-black overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-black/50"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative text-white text-center p-6"
      >
        <h1 className="text-6xl font-bold">404</h1>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          className="text-2xl mt-2"
        >
         {message} 
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Error;
