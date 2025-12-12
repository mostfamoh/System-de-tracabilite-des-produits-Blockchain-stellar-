import React from 'react';
import { Link } from 'react-router-dom';
import { FaQrcode, FaShieldAlt, FaChartLine, FaUsers } from 'react-icons/fa';
import ClientProducts from './Client/Products'
const Home = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="flex items-center justify-between w-full">
        <div className="w-1/2">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 text-left break-words">
          Track Every Product From Source To Store 
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Transparent supply chain management powered by blockchain technology.
           Verify authenticity, track movement, and ensure trust.
        </p>
        <div className="flex space-x-4">
          <Link to="/scan" className="btn-primary px-8 py-3 text-lg">
            Scan QR Code
          </Link>
          <Link href="#client-products" className="btn-secondary px-8 py-3 text-lg">
            Go to Products
          </Link>
        </div>
        </div>

        <div className="card bg-base-100 w-96 shadow-sm">
      <div className="card-body">
        <h2>Product Status
            Verified Authentic</h2>
      </div>
    </div>
      </section>
      

      {/* Features */}
      <ClientProducts in="client-products" />

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
        <Link to="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block">
          Create Free Account
        </Link>
      </section>
    </div>
  );
};

export default Home;
