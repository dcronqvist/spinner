import Link from "next/link"
import { useEffect, useState } from "react"
import { ToastContainer } from "react-toastify"
import styled from "styled-components"
import Sidebar from "./sidebar"

const MainContainer = styled.main`
  height: 100vh;
  width: 100vw;
  padding-left: 50px;
  background-color: #202c33;
  color: white;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  overflow: hidden;

  header {
    width: 100%;
  }

  footer {
    margin-right: 50px;
    width: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: flex-end;
  }

  h1 {
    margin: 0px;
    margin-top: 20px;
    padding: 13px;
    width: 100%;
    height: 100px;
    font-size: 50px;
    font-weight: bold;
  }
`

const PageContainer = styled.div`
    margin-left: 50px;
    width: calc(100% - 300px - 100px);
    background-color: #374c59;
`

interface LayoutProps {
    children?: any
}

interface SidebarOption {
    name: string
    path: string
}

const Layout = (props: LayoutProps) => {
    const options: SidebarOption[] = [
        {
            name: "Home",
            path: "/"
        },
        {
            name: "Applications",
            path: "/applications"
        },
        {
            name: "New Application",
            path: "/new"
        },
        {
            name: "Check Repository",
            path: "/check"
        }
    ]

    return (
        <MainContainer>
            <header>
                <h1>spinner</h1>
            </header>
            <Sidebar>
                {options.map((option, index) => (
                    <Link href={option.path} key={index}>
                        {option.name}
                    </Link>   
                ))}
            </Sidebar>
            <PageContainer>
                {props.children}
            </PageContainer>
            <footer>
                <h5>hello i am a footer. i am just down here with maybe some info for you</h5>
            </footer>
            <ToastContainer />
        </MainContainer>
    );
}

export default Layout