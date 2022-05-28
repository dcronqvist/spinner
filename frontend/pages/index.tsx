import { Button, Card, CardActionArea, CardActions, CardContent, CircularProgress, Grid, Icon, Stack, Tooltip, Typography } from '@mui/material';
import axios from 'axios';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { Application } from '../model/application';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Cancel } from '@mui/icons-material';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import SummarizeIcon from '@mui/icons-material/Summarize';
import BrowserUpdatedIcon from '@mui/icons-material/BrowserUpdated';

// Relevant info on home page
// amount of running apps
// amount of paused apps
// amount of unpaused apps
// amount of stopped apps
// apps that are currently being updated

const Home: NextPage<HomeProps> = (props: HomeProps) => {
  const router = useRouter();
  const snackbar = useSnackbar();

  const refreshData = () => {
    router.replace(router.asPath, undefined, { scroll: false });
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData();

      if (props.failed) {
        snackbar.enqueueSnackbar("No response from backend!", { variant: "error", autoHideDuration: 3000 });
      }
    }, 5000);
    return () => clearInterval(intervalId);
  })

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

  const updatingRender = () => {
    const updating = props.applications.filter(a => a.is_updating);

    if (updating.length === 0) {
      // No update
      return (
        <Stack direction="row" spacing={2}>
          <Icon>
            <CheckCircleOutlineIcon color="success"/>
          </Icon>
          <Typography variant="h6">
            No apps updating!
          </Typography>
        </Stack>
      )
    }

    return (
      <Stack spacing={2} direction="column">
        <Stack direction="row" spacing={2}>
          <CircularProgress color="info" size="2rem"/>
          <Typography variant="h6">
            {updating.length} app{updating.length > 1 ? "s" : ""} updating!
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2}>
          {updating.map((app: Application) => {
            return (
              <Stack sx={{marginLeft: "20px"}} key={app.name} direction="row" spacing={2}>
                <Icon>
                  <BrowserUpdatedIcon color="info"/>
                </Icon>
                <Typography variant="body1">
                  {app.name}
                </Typography>
              </Stack>
            )
          })}
        </Stack>
      </Stack>
    )
  }

  return (
    <div>
      <Head>
        <title>spinner</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        <Grid item xs={6} sm={12} md={6}>
          <Card sx={{minHeight: "200px", display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={2}>
                    <Icon>
                      <CheckCircleOutlineIcon color="success"/>
                    </Icon>
                    <Typography variant="h6">
                      {props.applications.filter(a => a.status === "running").length} apps running
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={2}>
                    <Icon>
                      <Cancel color="error"/>
                    </Icon>
                    <Typography variant="h6">
                      {props.applications.filter(a => a.status === "exited").length} apps stopped
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={2}>
                    <Icon>
                      <PauseCircleFilledIcon color="warning"/>
                    </Icon>
                    <Typography variant="h6">
                      {props.applications.filter(a => a.status === "paused").length} apps paused
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={2}>
                    <Icon>
                      <SummarizeIcon color="info"/>
                    </Icon>
                    <Typography variant="h6">
                      {props.applications.length} apps total
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
            <Tooltip title="Start all stopped apps" placement="bottom">
              <Button sx={{width: "25%"}} variant="outlined" color="success" onClick={startAll}>Start</Button>
            </Tooltip>
            <Tooltip title="Pause all running apps" placement="bottom">
              <Button sx={{width: "25%"}} variant="outlined" color="warning" onClick={pauseAll}>Pause</Button>
            </Tooltip>
            <Tooltip title="Unpause all paused apps" placement="bottom">
              <Button sx={{width: "25%"}} variant="outlined" color="warning" onClick={unpauseAll}>Unpause</Button>
            </Tooltip>
            <Tooltip title="Stop all running apps" placement="bottom">
              <Button sx={{width: "25%"}} variant="outlined" color="error" onClick={stopAll}>Stop</Button>
            </Tooltip>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={6} sm={12} md={6}>
          <Card sx={{minHeight: "200px"}}>
            <CardContent>
              <Stack spacing={2}>
                {updatingRender()}

              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}

export default Home

interface HomeProps {
  failed: boolean
  applications: Application[]
}

export function getServerSideProps(context: any) {
  return axios.get(`http://${process.env.NEXT_PUBLIC_BACKEND_URL}/api/applications`).then(res => {
    return {
      props: {
        failed: false,
        applications: res.data as Application[]
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
