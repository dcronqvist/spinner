import type { NextPage } from 'next'
import Head from 'next/head';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../components/sidebar';
import styled from 'styled-components';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

interface ApplicationPageProps {
  applications: any
}

const Applications: NextPage<ApplicationPageProps> = (props: ApplicationPageProps) => {
  const router = useRouter();

  const refreshData = () => {
    router.replace(router.asPath);
  }

  return (
    <div>
      <Head>
        <title>spinner</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {props.applications.map((application: any, index: number) => {
        return (
          <>
          <p key={index}>{application.is_running ? "ON" : "OFF"} - {application.name} docker id={application.docker_id}</p>
          <input type="button" value="start" onClick={() => {
            axios.get("/api/applications/" + application.name + "/start").then(res => {
              if (res.status === 200) {
                toast.success("Application started");
                refreshData();
              }
            }).catch(err => {
              toast.error("Application already running");
            })
          }}/>
          <input type="button" value="stop" onClick={() => {
            axios.get("/api/applications/" + application.name + "/stop").then(res => {
              if (res.status === 200) {
                toast.success("Application stopped");
                refreshData();
              }
            }).catch(err => {
              toast.error("Application already stopped");
            })
          }}/>
          <input type="button" value="logs" onClick={() => {
            axios.get("/api/applications/" + application.name + "/logs").then(res => {
              if (res.status === 200) {
                toast(res.data);
                refreshData();
              }
            }).catch(err => {
              toast.error("Could not get logs");
            })
          }}/>
          </>
        );
      })}
    </div>
  )
}

export async function getServerSideProps(context: any) {
  const res = await axios.get("http://localhost:8080/api/applications");
  const applications = res.data; 

  return {
    props: {
      applications: applications || []
    }, // will be passed to the page component as props
  }
}

export default Applications
