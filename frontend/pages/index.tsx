import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styled from 'styled-components'

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>Hello Next.js 👋</h1>
      </main>
    </div>
  )
}

export default Home
