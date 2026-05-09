import axios from 'axios'
import React, { useState } from 'react'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault()
      setLoading(true)
      const response = await axios.post(backendUrl + '/api/user/admin', { email, password })
      if (response.data.success) {
        setToken(response.data.token)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>

      {/* Background pattern */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-96 h-96 bg-blue-50 rounded-full opacity-60' />
        <div className='absolute -bottom-40 -left-40 w-96 h-96 bg-blue-50 rounded-full opacity-60' />
      </div>

      <div className='relative w-full max-w-md mx-4'>

        {/* Top brand bar */}
        <div className='bg-blue-600 rounded-t-2xl px-8 py-5 flex items-center gap-3'>
          <div className='w-9 h-9 bg-white rounded-lg flex items-center justify-center'>
            <svg viewBox='0 0 24 24' className='w-5 h-5 fill-blue-600'>
              <path d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' />
            </svg>
          </div>
          <div>
            <p className='text-white font-bold text-lg leading-none tracking-wide'>Amulya</p>
            <p className='text-blue-200 text-xs mt-0.5'>Electronics</p>
          </div>
        </div>

        {/* Card */}
        <div className='bg-white shadow-xl rounded-b-2xl px-8 py-8'>

          <div className='mb-7'>
            <h1 className='text-2xl font-bold text-gray-800'>Welcome back</h1>
            <p className='text-gray-500 text-sm mt-1'>Sign in to access the admin dashboard</p>
          </div>

          <form onSubmit={onSubmitHandler} className='space-y-5'>

            {/* Email */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1.5'>
                Email Address
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-3 flex items-center pointer-events-none'>
                  <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2}
                      d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                  </svg>
                </div>
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  type='email'
                  placeholder='your@email.com'
                  required
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800
                    placeholder-gray-400 outline-none
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                    hover:border-gray-300 transition-all duration-200'
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1.5'>
                Password
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-3 flex items-center pointer-events-none'>
                  <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2}
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                  </svg>
                </div>
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  type='password'
                  placeholder='Enter your password'
                  required
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800
                    placeholder-gray-400 outline-none
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                    hover:border-gray-300 transition-all duration-200'
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type='submit'
              disabled={loading}
              className='w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                disabled:bg-blue-300 disabled:cursor-not-allowed
                text-white font-semibold rounded-xl text-sm
                transition-all duration-200 flex items-center justify-center gap-2 mt-2'
            >
              {loading ? (
                <>
                  <svg className='w-4 h-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8z' />
                  </svg>
                  Signing in...
                </>
              ) : 'Sign In to Admin Panel'}
            </button>

          </form>

          {/* Footer */}
          <div className='mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-1.5'>
            <svg className='w-3.5 h-3.5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2}
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
            </svg>
            <p className='text-xs text-gray-400'>Secure admin access only</p>
          </div>
        </div>

        {/* Bottom tag */}
        <p className='text-center text-xs text-gray-400 mt-4'>
          © 2025  All rights reserved
        </p>
      </div>
    </div>
  )
}

export default Login