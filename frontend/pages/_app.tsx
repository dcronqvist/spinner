import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/layout'
import { SnackbarProvider } from 'notistack'
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: "dark"
  }
})

function MyApp({ Component, pageProps }: AppProps) {
  return ( 
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SnackbarProvider>
    </ThemeProvider>
  )
}

export default MyApp
