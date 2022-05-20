import type { NextPage } from 'next'
import Head from 'next/head';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../components/sidebar';
import styled from 'styled-components';
import { useState } from 'react';

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>spinner</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ToastContainer/>
    </div>
  )
}

export default Home
