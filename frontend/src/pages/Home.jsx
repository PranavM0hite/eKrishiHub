// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import HeroImage from '../assets/farming_illustration.svg';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* 🧭 Navbar */}
      <nav className="sticky top-0 z-50 border-b border-green-100/60 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="text-2xl font-bold text-green-700 hover:text-green-900 transition-colors"
          >
            🌿 e-KrishiHub
          </Link>

          <div className="flex items-center gap-6 text-md font-medium text-gray-700">
            <Link to="/farmer-login" className="hover:text-green-600">
              Farmer
            </Link>
            <Link to="/customer-login" className="hover:text-green-600">
              Customer
            </Link>
            <a href="#about" className="hover:text-green-600">
              About
            </a>
          </div>
        </div>
      </nav>

      {/* 🎯 Hero Section */}
      <section className="mx-auto flex max-w-7xl flex-col-reverse items-center justify-between px-6 py-16 md:flex-row">
        {/* Left Text */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="md:w-1/2 text-center md:text-left"
        >
          <h1 className="mb-4 text-4xl font-extrabold text-green-800 md:text-5xl">
            Empowering Farmers, Connecting Communities 🌾
          </h1>
          <p className="mb-6 text-lg text-gray-700">
            Welcome to <strong>e-KrishiHub</strong> — a platform where Indian farmers can sell their
            crops, check weather updates, and plan tasks smartly!
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:justify-start">
            <Link
              to="/farmer-login"
              className="rounded bg-green-600 px-6 py-3 text-white shadow transition hover:bg-green-700"
            >
              Farmer Login
            </Link>
            <Link
              to="/customer-login"
              className="rounded border border-green-600 bg-white px-6 py-3 text-green-700 shadow transition hover:bg-green-100"
            >
              Customer Login
            </Link>
          </div>
        </motion.div>

        {/* Right Image */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-10 md:mb-0 md:w-1/2"
        >
          <img
            src={HeroImage}
            alt="Farming illustration"
            className="mx-auto w-full max-w-md drop-shadow-md"
          />
        </motion.div>
      </section>

      {/* ℹ️ About Section */}
      <section
        id="about"
        className="border-t border-green-200 bg-white px-6 py-12"
      >
        <div className="mx-auto max-w-4xl text-center">
          <motion.h2
            className="mb-4 text-3xl font-bold text-green-800"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            🌱 About e-KrishiHub
          </motion.h2>

          <motion.p
            className="text-md leading-relaxed text-gray-700"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            e-KrishiHub is a heartfelt digital platform made for Indian farmers 🤝. 
            From crop selling and real-time weather info to managing farming tasks, 
            we aim to make agriculture smarter and more connected. 
            Join us on this journey to nurture Bharat’s green future. 🇮🇳🌾
          </motion.p>
        </div>
      </section>
    </div>
  );
};

export default Home;
