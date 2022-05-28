import { Stack, Tooltip, Button, Paper, TextField } from '@mui/material';
import axios from 'axios';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

const Caddy: NextPage<CaddyProps> = (props: CaddyProps) => {

  const snackbar = useSnackbar();
  const [code, setCode] = useState(props.caddyfile);
  const [pressedTab, setPressedTab] = useState(false);
  const [selectionPos, setSelectionPos] = useState(0);
  const [selectionTarget, setSelectionTarget] = useState<HTMLInputElement | null>(null);
  
  useEffect(() => {
    if (pressedTab) {
      selectionTarget!.selectionStart = selectionPos + 2;
      selectionTarget!.selectionEnd = selectionPos + 2;
      setPressedTab(false);
      return;
    }
  }, [code]);

  const update = () => {
    axios.post("/api/caddy", {
      caddyfile: code
    }).then(res => {
      snackbar.enqueueSnackbar("Caddyfile updated!", { variant: "success" });

      axios.get("/api/caddy/reload").then(res => {
        snackbar.enqueueSnackbar("Caddy reloaded!", { variant: "success" });
      }).catch(err => {
        snackbar.enqueueSnackbar("Caddy reload failed!", { variant: "error" });
      })

    }).catch(err => {
      snackbar.enqueueSnackbar("Failed to update Caddyfile!", { variant: "error" });
    })
  }

  return (
    <div>
      <Head>
        <title>spinner - caddy</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Stack spacing={1} direction="row" sx={{
        marginBottom: "15px"
      }}>
        <Button variant="outlined" color="success" onClick={update}>Update Config</Button>
      </Stack>
      <Stack spacing={2}>
        <TextField onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const selectionPos = (e.target as HTMLInputElement).selectionStart!;
            
            setSelectionPos(selectionPos);
            setSelectionTarget(e.target as HTMLInputElement);
            setPressedTab(true);
            setCode(code.substring(0, selectionPos) + '  ' + code.substring(selectionPos));
          }
        }} value={code} multiline minRows={25} onChange={(e) => setCode(e.target.value)} InputProps={{style: {fontFamily: "consolas"}}}/>
      </Stack>
    </div>
  )
}

export default Caddy

interface CaddyProps {
  failed: boolean
  caddyfile: string
}

export function getServerSideProps(context: any) {
  return axios.get(`http://${process.env.NEXT_PUBLIC_BACKEND_URL}/api/caddy`).then(res => {
    return {
      props: {
        failed: false,
        caddyfile: res.data
      }
    }
  }).catch(err => {
    return {
      props: {
        failed: true,
        caddyfile: ""
      }
    }
  })
}
