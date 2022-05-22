import { Delete, NotStarted, Pause, PlayArrow, StopCircle } from "@mui/icons-material"
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Menu, MenuItem, Paper, SvgIconTypeMap, Typography } from "@mui/material"
import { OverridableComponent } from "@mui/material/OverridableComponent"
import { Box } from "@mui/system"
import axios from "axios"
import { useState } from "react"
import { toast } from "react-toastify"
import { Application } from '../../backend/src/entities/entities'

interface ApplicationPreviewProps {
    app: Application,
    forceRefresh: () => void
}

interface StatusConfig {
    color: "success" | "warning" | "error" | "info",
    text: string,
    buttons: JSX.Element[]
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
            toast.success("Container started!");
            forceRefresh();
        }).catch(err => {
            toast.error("Could not start container!");
            forceRefresh();
        })
    });

    const stopButton = createButton(StopCircle, "Stop", () => {
        axios.get(`/api/applications/${app.name}/stop`).then(res => {
            toast.success("Container stopped!");
            forceRefresh();
        }).catch(err => {
            toast.error("Could not stop container!");
            forceRefresh();
        })
    })

    const deleteButton = createButton(Delete, "Delete", () => {
        setDeleteAgreeOpen(true);
    })

    const pauseButton = createButton(Pause, "Pause", () => {
        axios.get(`/api/applications/${app.name}/pause`).then(res => {
            toast.success("Container paused!");
            forceRefresh();
        }).catch(err => {
            toast.error("Could not pause container!");
            forceRefresh();
        })
    })

    const unpauseButton = createButton(PlayArrow, "Unpause", () => {
        axios.get(`/api/applications/${app.name}/unpause`).then(res => {
            toast.success("Container unpaused!");
            forceRefresh();
        }).catch(err => {
            toast.error("Could not unpause container!");
            forceRefresh();
        })
    })

    switch (app.status) {
        case "running":
            return {
                color: "success",
                text: "on",
                buttons: [pauseButton, stopButton]
            }
        case "paused":
            return {
                color: "warning",
                text: "paused",
                buttons: [unpauseButton, stopButton]
            }
        case "exited":
            return {
                color: "error",
                text: "off",
                buttons: [startButton, deleteButton]
            }
        case "container_not_found":
            return {
                color: "error",
                text: "cnf",
                buttons: [deleteButton]
            }
        case "not_built":
            return {
                color: "warning",
                text: "creating",
                buttons: []
            }
        default:
            return {
                color: "info",
                text: app.status,
                buttons: [startButton, pauseButton, unpauseButton, stopButton, deleteButton]
            }
    }
}

const ApplicationPreview = (props: ApplicationPreviewProps) => {
    const paused = props.app.status === "paused";
    
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteAgreeOpen, setDeleteAgreeOpen] = useState(false);
    
    const statusConfig = getStatusConfig(props.app, () => setMenuOpen(false), props.forceRefresh, setDeleteAgreeOpen)

    const notifyUpdate = () => {
        axios.get(`/api/notify/${props.app.notification_id}`).then(res => {
            toast.success("Notification sent!");
            props.forceRefresh();
        }).catch(err => {
            toast.error("Could not send notification!");
            props.forceRefresh();
        })
    }

    const deleteApp = () => {
        axios.delete(`/api/applications/${props.app.name}`).then(res => {
            toast.success("Application deleted!");
            props.forceRefresh();
        }).catch(err => {
            toast.error("Could not delete application!");
            props.forceRefresh();
        })
    }

    return (
        <Paper variant="outlined" sx={{
            padding: "1rem",
        }}>
            <Box sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
            }}>
                <Menu open={menuOpen} onClose={() => {setMenuOpen(false); setAnchorEl(null)}} anchorEl={anchorEl}>
                    {statusConfig.buttons}
                </Menu>
                <Chip label={statusConfig.text} color={statusConfig.color} onClick={(e) => {setMenuOpen(true); setAnchorEl(e.currentTarget)}}/>
                <Typography sx={{marginLeft: "20px"}} variant="body1">{props.app.name}</Typography>
            </Box>
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
        </Paper>
    );
}

export default ApplicationPreview