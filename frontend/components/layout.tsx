import { AddCircle, Apps, House, Lock, Menu } from "@mui/icons-material"
import { AppBar, Box, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Toolbar, Typography } from "@mui/material"
import { useRouter } from "next/router"
import { useState } from "react"

interface LayoutProps {
    children?: any
}

interface SidebarOption {
    name: string
    path: string
    icon: JSX.Element
}

const Layout = (props: LayoutProps) => {
    const [open, setOpen] = useState(false)
    const router = useRouter();

    const options: SidebarOption[] = [
        {
            name: "Home",
            path: "/",
            icon: <House />
        },
        {
            name: "Applications",
            path: "/applications",
            icon: <Apps />
        },
        {
            name: "Caddy",
            path: "/caddy",
            icon: <Lock />
        },
        {
            name: "New Application",
            path: "/new",
            icon: <AddCircle />
        }
    ]

    return (
        // <MainContainer>
        //     <header>
        //         <h1>spinner</h1>
        //     </header>
        //     <Sidebar>
        //         {options.map((option, index) => (
        //             <Link href={option.path} key={index}>
        //                 {option.name}
        //             </Link>   
        //         ))}
        //     </Sidebar>
        //     <PageContainer>
        //         {props.children}
        //     </PageContainer>
        //     <footer>
        //         <h5>hello i am a footer. i am just down here with maybe some info for you</h5>
        //     </footer>
        //     <ToastContainer />
        // </MainContainer>
        <>
        <AppBar position="static">
            <Toolbar variant="regular">
                <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setOpen(true)}>
                    <Menu />
                </IconButton>
                <Typography variant="h5" color="inherit">
                    spinner
                </Typography>
            </Toolbar>
        </AppBar>
        <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
            <Box sx={{width: 250}} role="presentation">
                <List>
                    {options.map((option, index) => {
                        return (
                            <ListItem key={index} disablePadding>
                                <ListItemButton onClick={() => { router.push(option.path); setOpen(false) }}>
                                    <ListItemIcon>
                                        {option.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={option.name} />
                                </ListItemButton>
                            </ListItem>
                        )
                    })}
                </List>
            </Box>
        </Drawer>
        <Box sx={{
            display: "flex",
            width: "100%",
            justifyContent: "center",
        }}>
            <Paper variant="outlined" sx={{
                transform: "translateY(20px)",
                width: "100%",
                maxWidth: "1000px",
                padding: "1rem",
                minHeight: "60vh",
            }}>
                {props.children}
            </Paper>
        </Box>
        </>
    );
}

export default Layout