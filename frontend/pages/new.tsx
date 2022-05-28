import { Delete } from '@mui/icons-material';
import { Box, Button, Collapse, IconButton, List, ListItem, Stack, TextField, Typography } from '@mui/material';
import axios from 'axios';
import type { NextPage } from 'next'
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { TransitionGroup } from 'react-transition-group';
import { PortBinding } from '../model/application';


const NewApplication: NextPage = (props: any) => {

    const router = useRouter();
    const snackbar = useSnackbar();
    const [name, setName] = useState('');
    const [imageTag, setImageTag] = useState('');
    const [repoOwner, setRepoOwner] = useState('');
    const [repoName, setRepoName] = useState('');
    const [repoBranch, setRepoBranch] = useState('');
    const [dockerFilePath, setDockerFilePath] = useState('');
    const [volumes, setVolumes] = useState<string[]>([]);
    const [envVars, setEnvVars] = useState<string[]>([]);
    const [portBindings, setPortBindings] = useState<PortBinding[]>([]);

    const clear = () => {
        setName('');
        setImageTag('');
        setRepoOwner('');
        setRepoName('');
        setRepoBranch('');
        setDockerFilePath('');
        setVolumes([]);
        setEnvVars([]);
        setPortBindings([]);
    }

    const verify = () => {
        return axios.get(`/api/verify?owner=${repoOwner}&repo=${repoName}&branch=${repoBranch}${dockerFilePath ? `&path=${dockerFilePath}` : ''}`).then(res => {
            return true;
        }).catch(err => {
            console.log(err)
            return false;
        })
    }

    const create = () => {
        verify().then(success => {
            if (success) {
                snackbar.enqueueSnackbar('Successfully verified!', { variant: 'success' });

                axios.post("/api/applications", {
                    name: name,
                    image_tag: imageTag,
                    repo_owner: repoOwner,
                    repo_name: repoName,
                    repo_branch: repoBranch,
                    docker_file_path: dockerFilePath,
                    volumes: volumes,
                    env_vars: envVars,
                    port_bindings: portBindings
                }).then(res => {
                    snackbar.enqueueSnackbar('Successfully created!', { variant: 'success' });
                    clear();
                    router.push('/applications');
                }).catch(err => {
                    snackbar.enqueueSnackbar('Failed to create!', { variant: 'error' });
                })
            }
            else {
                snackbar.enqueueSnackbar('Verification failed', { variant: 'error' });
            }
        })
    }

    return (
        <Box component="form" onSubmit={(e: any) => { e.preventDefault(); create() }}>
            {/* <Typography sx={{marginBottom: "10px"}} variant="h5">New Application</Typography> */}
            <Stack sx={{ marginBottom: "10px" }} spacing={2} direction="row">
                <Button type="submit" variant="outlined" color="success">Create</Button>
                <Button variant="outlined" color="warning" onClick={clear}>Clear</Button>
            </Stack>
            <Stack spacing={1} direction="column">
                <TextField required variant="outlined" label="Application Name" value={name} onChange={(e) => setName(e.target.value)} />
                <TextField required variant="outlined" label="Image Tag" value={imageTag} onChange={(e) => setImageTag(e.target.value)} />
                <TextField required variant="outlined" label="GitHub Repository Owner" value={repoOwner} onChange={(e) => setRepoOwner(e.target.value)} />
                <TextField required variant="outlined" label="GitHub Repository Name" value={repoName} onChange={(e) => setRepoName(e.target.value)} />
                <TextField required variant="outlined" label="GitHub Repository Branch" value={repoBranch} onChange={(e) => setRepoBranch(e.target.value)} />
                <TextField variant="outlined" label="Docker File Path" value={dockerFilePath} onChange={(e) => setDockerFilePath(e.target.value)} />
                <Button onClick={() => setVolumes([...volumes, ""])}>Add volume</Button>
                <TransitionGroup component={Stack} spacing={1}>
                {volumes.map((volume, index) => (
                    <Collapse key={index}>
                        <Stack direction="row" spacing={1}>
                            <TextField helperText="host/path:container/path" fullWidth required variant="outlined" label="Volume" value={volume} onChange={(e) => { setVolumes([...volumes.slice(0, index), e.target.value, ...volumes.slice(index + 1)]) }}/>
                            <Box sx={{ height: "100%" }}>
                                <IconButton size='large' onClick={() => setVolumes(volumes.filter((v, i) => i != index))}>
                                    <Delete fontSize="inherit"/>
                                </IconButton>
                            </Box>
                        </Stack>
                    </Collapse>
                ))}
                </TransitionGroup>
                <Button onClick={() => setEnvVars([...envVars, ""])}>Add Environment variable</Button>
                <TransitionGroup component={Stack} spacing={1}>
                {envVars.map((envVar, index) => (
                    <Collapse key={index}>
                        <Stack direction="row" spacing={1}>
                            <TextField helperText="KEY=VALUE" fullWidth required variant="outlined" label="Environment variable" value={envVar} onChange={(e) => { setEnvVars([...envVars.slice(0, index), e.target.value, ...envVars.slice(index + 1)]) }}/>
                            <Box sx={{ height: "100%" }}>
                                <IconButton size='large' onClick={() => setEnvVars(envVars.filter((v, i) => i != index))}>
                                    <Delete fontSize="inherit"/>
                                </IconButton>
                            </Box>
                        </Stack>
                    </Collapse>
                ))}
                </TransitionGroup>
                <Button onClick={() => setPortBindings([...portBindings, { host_port: 0, container_port: "" }])}>Add Port Binding</Button>
                <TransitionGroup component={Stack} spacing={1}>
                {portBindings.map((binding, index) => (
                    <Collapse key={index}>
                        <Stack direction="row" spacing={1}>
                            <TextField inputMode='numeric' fullWidth required variant="outlined" label="Host Port" value={binding.host_port} onChange={(e) => { e.target.value !== "" && setPortBindings([...portBindings.slice(0, index), { host_port: parseInt(e.target.value), container_port: binding.container_port }, ...portBindings.slice(index + 1)]) }}/>
                            <TextField fullWidth required variant="outlined" label="Container Port" value={binding.container_port} onChange={(e) => { setPortBindings([...portBindings.slice(0, index), { host_port: binding.host_port, container_port: e.target.value }, ...portBindings.slice(index + 1)]) }}/>
                            <Box sx={{ height: "100%" }}>
                                <IconButton size='large' onClick={() => setPortBindings(portBindings.filter((v, i) => i != index))}>
                                    <Delete fontSize="inherit"/>
                                </IconButton>
                            </Box>
                        </Stack>
                    </Collapse>
                ))}
                </TransitionGroup>
            </Stack>
        </Box>
    )
}

export default NewApplication