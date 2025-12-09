import React from 'react';
import { Link } from 'react-router-dom';
import { FaQrcode, FaShieldAlt, FaChartLine, FaUsers } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Product Traceability System
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Track, verify, and ensure the authenticity of products throughout the supply chain
          using blockchain technology
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/register/client" className="btn-primary px-8 py-3 text-lg">
            Get Started
          </Link>
          <Link to="/scan" className="btn-secondary px-8 py-3 text-lg">
            Scan QR Code
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-4 gap-8">
        {[
          {
            icon: FaQrcode,
            title: 'QR Code Scanning',
            description: 'Scan QR codes to instantly verify product authenticity',
          },
          {
            icon: FaShieldAlt,
            title: 'Blockchain Security',
            description: 'Immutable records secured by blockchain technology',
          },
          {
            icon: FaChartLine,
            title: 'Supply Chain Tracking',
            description: 'Complete visibility of product journey from factory to store',
          },
          {
            icon: FaUsers,
            title: 'Multi-Role Platform',
            description: 'Supports manufacturers, transporters, warehouses, stores, and clients',
          },
        ].map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md text-center card-hover">
              <Icon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          );
        })}
      </section>

      {/* How It Works */}
      <section className="bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: 1, title: 'Register', description: 'Create a free client account instantly' },
            { step: 2, title: 'Browse', description: 'View all products in the system' },
            { step: 3, title: 'Verify', description: 'Scan QR codes to verify authenticity' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">{item.step}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 text-white p-12 rounded-xl text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl mb-8">Join thousands of users tracking products worldwide</p>
        <Link to="/register/client" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block">
          Create Free Account
        </Link>
      </section>
    </div>
  );
};

export default Home;
