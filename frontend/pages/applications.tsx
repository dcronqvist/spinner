import { Box, Button, ButtonGroup, Stack, Tooltip } from '@mui/material';
import axios from 'axios';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { Application } from '../model/application';
import ApplicationPreview from '../components/applicationPreview';

interface ApplicationPageProps {
  applications: Application[],
  failed: boolean,
}

const Applications: NextPage<ApplicationPageProps> = (props: ApplicationPageProps) => {
  const router = useRouter();
  const snackbar = useSnackbar();

  const refreshData = () => {
    router.replace(router.asPath, undefined, { scroll: false });
  }

  const actionForAllApps = (apiUrl: (app: Application) => string, onStatus: string, successMsg: (app: Application) => string, errorMsg: (app: Application) => string) => {
    if (props.failed) {
      snackbar.enqueueSnackbar('No connection to backend.', { variant: 'error' });
      return;
    }

    console.log(props.applications)
    props.applications.filter(app => app.status === onStatus).forEach(app => {
      axios.get(apiUrl(app)).then(res => {
        refreshData()
        snackbar.enqueueSnackbar(successMsg(app), { variant: 'success' });
      }).catch(err => {
        snackbar.enqueueSnackbar(errorMsg(app), { variant: 'error' });
      });
    })
  }

  const startAll = () => actionForAllApps(app => `/api/applications/${app.name}/start`, 'exited', app => `Started ${app.name}`, app => `Failed to start ${app.name}`);
  const stopAll = () => actionForAllApps(app => `/api/applications/${app.name}/stop`, 'running', app => `Stopped ${app.name}`, app => `Failed to stop ${app.name}`);
  const pauseAll = () => actionForAllApps(app => `/api/applications/${app.name}/pause`, 'running', app => `Paused ${app.name}`, app => `Failed to pause ${app.name}`);
  const unpauseAll = () => actionForAllApps(app => `/api/applications/${app.name}/unpause`, 'paused', app => `Unpaused ${app.name}`, app => `Failed to unpause ${app.name}`);

  useEffect(() => {
      const intervalId = setInterval(() => {
        refreshData();

        if (props.failed) {
          snackbar.enqueueSnackbar("No response from backend!", { variant: "error", autoHideDuration: 3000 });
        }
      }, 5000);
      return () => clearInterval(intervalId);
  })

  return (
    <>
      <Head>
        <title>spinner</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Stack spacing={1} direction="row" sx={{
        marginBottom: "15px"
      }}>
        <Tooltip title="Start all stopped apps" placement="top">
          <Button variant="outlined" color="success" onClick={startAll}>Start All</Button>
        </Tooltip>
        <Tooltip title="Pause all running apps" placement="top">
          <Button variant="outlined" color="warning" onClick={pauseAll}>Pause All</Button>
        </Tooltip>
        <Tooltip title="Unpause all paused apps" placement="top">
          <Button variant="outlined" color="warning" onClick={unpauseAll}>Unpause All</Button>
        </Tooltip>
        <Tooltip title="Stop all running apps" placement="top">
          <Button variant="outlined" color="error" onClick={stopAll}>Stop All</Button>
        </Tooltip>
      </Stack>
      <Stack spacing={2}>
        {props.applications.map((application: any, index: number) => {
          return (
            <ApplicationPreview forceRefresh={refreshData} app={application} key={index} />
          );
        })}
      </Stack>
    </>
  )
}

export function getServerSideProps(context: any) {
  return axios.get(`http://${process.env.NEXT_PUBLIC_BACKEND_URL}/api/applications`).then(res => {
    return {
      props: {
        failed: false,
        applications: res.data
      }
    }
  }).catch(err => {
    return {
      props: {
        failed: true,
        applications: []
      }
    }
  })
}

export default Applications
