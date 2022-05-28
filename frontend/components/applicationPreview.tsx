import { Close, Delete, ExpandMore, NotStarted, Pause, PlayArrow, StopCircle } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, Button, Chip, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, IconButton, Link, Menu, MenuItem, Paper, Stack, SvgIconTypeMap, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import { OverridableComponent } from "@mui/material/OverridableComponent"
import { Box } from "@mui/system"
import axios from "axios"
import NextLink from "next/link"
import { useRouter } from "next/router"
import { useSnackbar } from "notistack"
import React, { ReactNode, useState } from "react"
import { Application, PortBinding, EnvVar } from '../model/application'

interface ApplicationPreviewProps {
    app: Application,
    forceRefresh: () => void
}

interface StatusConfig {
    color: "success" | "warning" | "error" | "info",
    text: string,
    buttons: JSX.Element[],
    hasProgress: boolean
}

const getStatusConfig = (app: Application, closeMenu: () => void, forceRefresh: () => void, setDeleteAgreeOpen: (b: boolean) => void): StatusConfig => {
    const createButton = (Icon: OverridableComponent<SvgIconTypeMap<{}, "svg">>, text: string, onClick: () => void) => {
        return (
            <MenuItem disableRipple key={text} onClick={() => {
                onClick();
                closeMenu();
            }}>
                <Icon sx={{marginRight: "8px"}}/>
                <Typography variant="button">{text}</Typography>
            </MenuItem>
        )
    }

    const startButton = createButton(NotStarted, "Start", () => {
        axios.get(`/api/applications/${app.name}/start`).then(res => {
            forceRefresh();
        }).catch(err => {
            forceRefresh();
        })
    });

    const stopButton = createButton(StopCircle, "Stop", () => {
        axios.get(`/api/applications/${app.name}/stop`).then(res => {
            forceRefresh();
        }).catch(err => {
            forceRefresh();
        })
    })

    const deleteButton = createButton(Delete, "Delete", () => {
        setDeleteAgreeOpen(true);
    })

    const pauseButton = createButton(Pause, "Pause", () => {
        axios.get(`/api/applications/${app.name}/pause`).then(res => {
            forceRefresh();
        }).catch(err => {
            forceRefresh();
        })
    })

    const unpauseButton = createButton(PlayArrow, "Unpause", () => {
        axios.get(`/api/applications/${app.name}/unpause`).then(res => {
            forceRefresh();
        }).catch(err => {
            forceRefresh();
        })
    })

    if (app.is_updating) {
        return {
            color: "info",
            text: "updating",
            buttons: [],
            hasProgress: true
        }
    }

    switch (app.status) {
        case "running":
            return {
                color: "success",
                text: "running",
                buttons: [pauseButton, stopButton],
                hasProgress: false
            }
        case "paused":
            return {
                color: "warning",
                text: "paused",
                buttons: [unpauseButton, stopButton],
                hasProgress: false
            }
        case "exited":
            return {
                color: "error",
                text: "stopped",
                buttons: [startButton, deleteButton],
                hasProgress: false
            }
        case "container_not_found":
            return {
                color: "error",
                text: "cnf",
                buttons: [deleteButton],
                hasProgress: false
            }
        case "not_built":
            return {
                color: "warning",
                text: "creating",
                buttons: [],
                hasProgress: true
            }
        default:
            return {
                color: "info",
                text: app.status || "unknown",
                buttons: [startButton, pauseButton, unpauseButton, stopButton, deleteButton],
                hasProgress: false
            }
    }
}

const ApplicationPreview = (props: ApplicationPreviewProps) => {
    const snackbar = useSnackbar();
    const router = useRouter();

    const paused = props.app.status === "paused";
    
    const [loadedLogs, setLoadedLogs] = useState("");
    const [logWindowOpen, setLogWindowOpen] = useState(false);
    const [accOpen, setAccOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteAgreeOpen, setDeleteAgreeOpen] = useState(false);
    
    const statusConfig = getStatusConfig(props.app, () => setMenuOpen(false), props.forceRefresh, setDeleteAgreeOpen)

    const notifyUpdate = () => {
        axios.get(`/api/notify/${props.app.notification_id}`).then(res => {
            props.forceRefresh();
        }).catch(err => {
            props.forceRefresh();
        })
    }

    const deleteApp = () => {
        axios.delete(`/api/applications/${props.app.name}`).then(res => {
            snackbar.enqueueSnackbar("Application deleted", {variant: "success"});
            setDeleteAgreeOpen(false);
            props.forceRefresh();
        }).catch(err => {
            props.forceRefresh();
        })
    }

    const recursiveParentHasID = (node: HTMLElement, id: string): boolean => {
        if (node.id === id) {
            return true;
        } else if (node.parentElement) {
            return recursiveParentHasID(node.parentElement, id);
        } else {
            return false;
        }
    }

    const appRenderer = (app: Application) => {
        const box = (key: string, value: string | JSX.Element, link?: boolean) => {
            if (React.isValidElement(value)) {
                return (
                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}>
                        <Typography variant="button">{key}</Typography>
                        {value}
                    </Box>
                )
            }

            return (
                <Box sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <Typography variant="button">{key}</Typography>
                    {link ? <Link rel="noreferrer" target="_blank" href={`${app.github_repo_url}#${app.github_repo_branch}`}>{`${app.github_repo_url}#${app.github_repo_branch}`}</Link> : <Typography variant="body1">{value}</Typography>}
                </Box>
            )
        }

        return (
            <>
            {box("Created At", new Date(app.created_at).toLocaleString())}
            {box("Updated At", new Date(app.updated_at).toLocaleString())}
            {box("Status", app.status || "unknown")}
            {box("Image", app.image_tag)}
            {box("Docker File Path", app.docker_file_path)}
            {box("Port bindings", <Stack spacing={1} direction="row">{app.port_bindings ? app.port_bindings.map((pb, i) => <Typography key={i} variant="body1">{`${pb.host_port}:${pb.container_port}`}</Typography>) : ""}</Stack>)}
            {box("Notification", <Button onClick={() => {
                var getUrl = window.location;
                var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[0];
                snackbar.enqueueSnackbar("Notification link copied to clipboard", {variant: "success"});
                navigator.clipboard.writeText(`${baseUrl}api/notify/${app.notification_id}`);
            }} variant="outlined">Copy Link</Button>)}
            {box("GitHub Repo", <Link target="_blank" rel="noreferrer" href={`${app.github_repo_url}#${app.github_repo_branch}`}><Button variant="outlined">Go to repo</Button></Link>)}
            {box("Docker Container ID", app.docker_id ? <Button onClick={() => {
                snackbar.enqueueSnackbar("Container ID copied to clipboard", {variant: "success"});
                navigator.clipboard.writeText(app.docker_id!);
            }} variant="outlined">Copy ID</Button> : "")}
            {box("Logs", <Button variant="outlined" onClick={() => {
                axios.get(`/api/applications/${app.name}/logs?lines=100`).then(res => {
                    const log = res.data;
                    setLoadedLogs(log);

                    setLogWindowOpen(true);
                }).catch(err => {
                    snackbar.enqueueSnackbar("Failed to load logs", {variant: "error"});
                })
            }}>Show</Button>)}
            <div>
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="button">Environment Variables</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Key</TableCell>
                                        <TableCell>Value</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {app.env_vars ? app.env_vars.map((ev, i) => {
                                        return (
                                            <TableRow key={i}>
                                                <TableCell>{ev.key}</TableCell>
                                                <TableCell>{ev.value}</TableCell>
                                            </TableRow>
                                        )
                                    }) : ""}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </AccordionDetails>
                </Accordion>
                <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="button">Volumes</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Host Path</TableCell>
                                        <TableCell>Container Path</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {app.volumes ? app.volumes.map((ev, i) => {
                                        return (
                                            <TableRow key={i}>
                                                <TableCell>{ev.split(":")[0]}</TableCell>
                                                <TableCell>{ev.split(":")[1]}</TableCell>
                                            </TableRow>
                                        )
                                    }) : ""}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </AccordionDetails>
                </Accordion>
            </div>
            </>
        )
    }

    const labelRender = (statusConfig: StatusConfig) => {
        if (statusConfig.hasProgress) {
            return (
                <Box sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <CircularProgress color="inherit" size={16}/>
                    <Typography sx={{ marginLeft: "8px"}} variant="inherit">{statusConfig.text}</Typography>
                </Box>
            )
        }
        return statusConfig.text;
    }

    return (
        <Accordion expanded={accOpen} onChange={(e) => {
            if (!recursiveParentHasID(e.target as HTMLElement, "statusButton")) {
                setAccOpen(!accOpen);
            }
        }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{
                    display: "flex",
                    alignItems: "center",
                }}>
                    <Box id="statusButton">
                        <Chip variant="filled" label={labelRender(statusConfig)} color={statusConfig.color} onClick={(e) => { statusConfig.buttons.length > 0 && setMenuOpen(true); setAnchorEl(e.currentTarget)}}/>
                        <Menu id="statusButton" open={menuOpen} onClose={() => {setMenuOpen(false); setAnchorEl(null)}} anchorEl={anchorEl}>
                            {statusConfig.buttons}
                        </Menu>
                    </Box>
                    <Box sx={{ width: "auto" }}>
                        <Typography sx={{ marginLeft: "20px" }} variant="body1">{props.app.name}</Typography>
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Stack divider={<Divider />} spacing={2}>
                    {appRenderer(props.app)}
                </Stack>
            </AccordionDetails>
            <Dialog open={deleteAgreeOpen} onClose={() => setDeleteAgreeOpen(false)}>
                <DialogTitle>Delete application</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this application?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteAgreeOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={deleteApp} color="primary">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={logWindowOpen} scroll="paper" onClose={() => setLogWindowOpen(false)}>
                <DialogTitle>
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "space-between",
                    }}>
                        <Typography variant="h6">Logs</Typography>
                        <IconButton onClick={() => setLogWindowOpen(false)}>
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {loadedLogs.split("\n").map((line, i) => <Typography key={i} variant="body1">{line}</Typography>)}
                    </DialogContentText>
                </DialogContent>
            </Dialog>
        </Accordion>
    );
}

export default ApplicationPreview