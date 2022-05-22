import { Stack } from '@mui/material';
import axios from 'axios';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Application } from '../../backend/src/entities/entities';
import ApplicationPreview from '../components/applicationPreview';

interface ApplicationPageProps {
  applications: Application[],
  failed: boolean,
}

const Applications: NextPage<ApplicationPageProps> = (props: ApplicationPageProps) => {
  const router = useRouter();

  const refreshData = () => {
    router.replace(router.asPath);
  }

  useEffect(() => {
      const intervalId = setInterval(() => {
        refreshData();

        if (props.failed) {
          toast.error('Failed to fetch applications from backend', {
            autoClose: 1000
          });
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
  return axios.get('http://localhost:8080/api/applications').then(res => {
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
