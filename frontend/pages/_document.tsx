import { Html, Head, Main, NextScript } from 'next/document'
import { SnackbarProvider } from 'notistack'
import Layout from '../components/layout'

export default function Document() {
  return (
    <Html>
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}