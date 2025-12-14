import React from 'react';
import { Link } from 'react-router-dom';
import { FaQrcode, FaShieldAlt, FaChartLine, FaUsers,FaIndustry,FaTruck,FaWarehouse,FaStore,FaCheck,FaSpinner } from 'react-icons/fa';
import ClientProducts from './Client/Products'
const Home = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="flex items-center justify-between w-full p-20 bg-blue-50">
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
          <div className='w-[450px] h-[300px] absolute bg-blue-500 opacity-20 rounded-lg  rotate-6 right-[428px] '></div>
        <div className="card bg-white w-[450px] shadow-sm rounded-lg  relative">
      <div className="card-body">
        <div className='m-4 relative '>
          <div className='absolute top-[1px] left-[0.2px] bg-green-200 w-[50px] h-[50px] rounded-full'></div>
          <FaCheck className='text-green-500 absolute top-[18px] left-[15px] ' />
          <h2 className="text-sm text-gray-500 ml-16">Product Status</h2>
        <p className='ml-16'>Verified Authentic</p>
        </div>
        <div className='m-3 relative '>
          <div className='absolute top-[5px] left-[1.75px] bg-blue-200 w-[30px] h-[30px] rounded-lg'></div>
          <FaIndustry className='text-blue-500 absolute top-3 left-2 w-[17px]'/>
          <div className='absolute top-[8px] right-[0.2px] bg-green-500 w-[25px] h-[25px] rounded-full'></div>
          <FaCheck className='text-white absolute top-[13px] right-[4px] ' />
        <h2 className="text-sm text-gray-500 ml-12">Manufacturer</h2>
        <p className='ml-12'>TechCorp Industries</p>
        </div>
        <div className='m-3 relative'>
          <div className='absolute top-[5px] left-[1.75px] bg-blue-200 w-[30px] h-[30px] rounded-lg'></div>
          <FaTruck className='text-blue-500 absolute top-3 left-2 w-[18px]' />
          <div className='absolute top-[8px] right-[0.2px] bg-green-500 w-[25px] h-[25px] rounded-full'></div>
          <FaCheck className='text-white absolute top-[13px] right-[4px] ' />
        <h2 className="text-sm text-gray-500 ml-12">Transport</h2>
        <p className='ml-12'>Global Logistics</p>
        </div>
        <div className='m-3 relative'>
          <div className='absolute top-[5px] left-[1.75px] bg-blue-200 w-[30px] h-[30px] rounded-lg'></div>
          <FaWarehouse className='text-blue-500 absolute top-3 left-2 w-[18px]' />
          <div className='absolute top-[8px] right-[0.2px] bg-green-500 w-[25px] h-[25px] rounded-full'></div>
          <FaCheck className='text-white absolute top-[13px] right-[4px] ' />
        <h2 className="text-sm text-gray-500 ml-12">Warehouse</h2>
        <p className='ml-12'>Central Storage</p>
        </div>
        <div className='m-3 relative'>
          <div className='absolute top-[5px] left-[1.75px] bg-blue-200 w-[30px] h-[30px] rounded-lg'></div>
          <FaStore className='text-blue-500 absolute top-3 left-2 w-[18px]'  />
          <FaSpinner className='text-gray-300 absolute top-[13px] right-[4px] ' />
        <h2 className="text-sm text-gray-500 ml-12">Store</h2>
        <p className='ml-12'>Retail Hub</p>
        </div>
      </div>
    </div>
      </section>
      

      {/* Features */}
      <ClientProducts in="client-products" />
<div className='bg-blue-50 pt-10'>
  <h2 className="text-3xl font-bold text-center mb-4">Why Choose ChainTrace?</h2>
  <p className='text-center text-gray-500'> Blockchain-powered transparency for every stakeholder</p>
 <section className="grid md:grid-cols-4 gap-8 bg-blue-50 p-10">
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
      </div>
      
      

      {/* CTA */}
      <section className="bg-primary-600 text-white p-12 rounded-xl text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl mb-8">Join the future of supply chain transparency</p>
        <Link to="/register" className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block">
          Sign In Now
        </Link>
      </section>
    </div>
  );
};

export default Home;
