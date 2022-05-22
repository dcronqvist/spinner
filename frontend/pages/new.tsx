import axios from 'axios';
import type { NextPage } from 'next'
import Head from 'next/head';
import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import styled from 'styled-components';
import { PortBinding } from '../../backend/src/entities/entities';

const Container = styled.div<{ outline?: string}>`
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    justify-content: flex-start;

    outline: ${props => props.outline ? props.outline : "none"};
`

const Row = styled.div<{shiftRight?: number, noPadding?: boolean}>`
    padding: ${props => props.noPadding ? "0px" : "5px"};
    display: flex;
    align-items: flex-start;
    flex-direction: row;
    justify-content: flex-start;
    transform: translateX(${props => props.shiftRight ? props.shiftRight : 0}px);

    & span {
        margin-left: 10px;
    }
`

const InfoRowHeader = styled.span`
    font-weight: 600;
    min-width: 130px;
`

const InfoRow = (props: any) => {
    return (
        <Row>
            <InfoRowHeader>{props.header}</InfoRowHeader>
            {props.children}
        </Row>
    );
}

const StyledInput = styled.input`
    color: white;
    background-color: #5f849b;
    border: 1px solid #4f6d7e;
`

const Button = styled.input<{ color: string }>`
    background-color: ${props => props.color};
    opacity: ${props => props.disabled ? 0.5 : 1};
    border: 1px solid ${props => lightenDarkenColor(props.color, 50)};
    border-radius: 5px;
    padding: 2px;
    padding-left: 8px;
    padding-right: 8px;
    margin-right: 10px;

    &:hover {
        cursor: pointer;
        background-color: ${props => lightenDarkenColor(props.color, 20)};
    }

    &:active {
        background-color: ${props => lightenDarkenColor(props.color, -20)};
    }
`

export function lightenDarkenColor(col: string, amt: number): string {
    let usePound = false
    if (col[0] == '#') {
        col = col.slice(1)
        usePound = true
    }
    const num = parseInt(col, 16)
    let r = (num >> 16) + amt
    if (r > 255) r = 255
    else if (r < 0) r = 0
    let b = ((num >> 8) & 0x00ff) + amt
    if (b > 255) b = 255
    else if (b < 0) b = 0
    let g = (num & 0x0000ff) + amt
    if (g > 255) g = 255
    else if (g < 0) g = 0
    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16)
}

const NewApplication: NextPage = (props: any) => {
    const [name, setName] = useState("");
    const [imageTag, setImageTag] = useState("");
    const [repoOwner, setRepoOwner] = useState("");
    const [repoName, setRepoName] = useState("");
    const [repoBranch, setRepoBranch] = useState("");
    const [dockerFilePath, setDockerFilePath] = useState("");

    const [portBindings, setPortBindings] = useState([] as PortBinding[]);
    const [envVars, setEnvVars] = useState([] as string[]);
    const [volumes, setVolumes] = useState([] as string[]);

    const verify = () => {
        axios.get(`/api/verify?owner=${repoOwner}&repo=${repoName}&branch=${repoBranch}${dockerFilePath === "" ? "" : "&path=" + dockerFilePath}`).then(res => {
            if (res.status === 200) {
                toast.success("Verification successful!");
            }
        }).catch(err => {
            toast.error("Verification failed!");
        })
    }

    const create = () => {
        axios.post(`/api/applications`, {
            name: name,
            image_tag: imageTag,
            repo_owner: repoOwner,
            repo_name: repoName,
            repo_branch: repoBranch,
            docker_file_path: dockerFilePath,
            port_bindings: portBindings,
            env_vars: envVars,
            volumes: volumes
        }).then(res => {
            if (res.status === 200) {
                toast.success("Application created!");
            }
        }).catch(err => {
            toast.error("Application creation failed!");
        })
    }

    return (
        <>
        <Head>
            <title>spinner - new app</title>
        </Head>
        <Container>
            <InfoRow header="name">
                <StyledInput type="text" onChange={(e) => setName(e.target.value)}/>
            </InfoRow>
            <InfoRow header="image tag">
                <StyledInput type="text" onChange={(e) => setImageTag(e.target.value)}/>
            </InfoRow>
            <InfoRow header="repo owner">
                <StyledInput type="text" onChange={(e) => setRepoOwner(e.target.value)}/>
            </InfoRow>
            <InfoRow header="repo name">
                <StyledInput type="text" onChange={(e) => setRepoName(e.target.value)}/>
            </InfoRow>
            <InfoRow header="repo branch">
                <StyledInput type="text" onChange={(e) => setRepoBranch(e.target.value)}/>
            </InfoRow>
            <InfoRow header="docker file path">
                <StyledInput type="text" onChange={(e) => setDockerFilePath(e.target.value)}/>
            </InfoRow>
            <InfoRow header="port bindings">
                <Container>
                    <Button onClick={() => setPortBindings([...portBindings, { host_port: 0, container_port: "" }])} type="button" value="new" color="#c0c0c0"/>
                    {portBindings.map((portBinding, index) => {
                        const updateHostPort = (port: string) => {
                            const me = portBindings[index];
                            me.host_port = parseInt(port);
                            portBindings[index] = me;
                            setPortBindings([...portBindings]);
                        }

                        const updateContainerPort = (port: string) => {
                            const me = portBindings[index];
                            me.container_port = port;
                            portBindings[index] = me;
                            setPortBindings([...portBindings]);
                        }

                        return (
                            <Container key={index} outline="1px solid #5f849b">
                                <InfoRow header="host port">
                                    <StyledInput type="text" onChange={(e) => updateHostPort(e.target.value)}/>
                                </InfoRow>
                                <InfoRow header="container port">
                                    <StyledInput type="text" onChange={(e) => updateContainerPort(e.target.value)}/>
                                </InfoRow>
                                <Row shiftRight={10}>
                                    <Button onClick={() => setPortBindings(portBindings.filter((_, i) => i !== index))} type="button" value="remove" color="#c0c0c0"/>
                                </Row>
                            </Container>
                        )
                    })}
                </Container>
            </InfoRow>
            <InfoRow header="environment">
                <Container>
                    <Button onClick={() => setEnvVars([...envVars, ""])} type="button" value="new" color="#c0c0c0"/>
                    {envVars.map((envVar, index) => {
                        const updateEnvVar = (env: string) => {
                            let me = envVars[index];
                            me = env;
                            envVars[index] = me;
                            setEnvVars([...envVars]);
                        }

                        return (
                            <Container key={index} outline="1px solid #5f849b">
                                <InfoRow header="env var">
                                    <StyledInput type="text" onChange={(e) => updateEnvVar(e.target.value)}/>
                                </InfoRow>
                                <Row shiftRight={10}>
                                    <Button onClick={() => setEnvVars(envVars.filter((_, i) => i !== index))} type="button" value="remove" color="#c0c0c0"/>
                                </Row>
                            </Container>
                        )
                    })}
                </Container>
            </InfoRow>
            <InfoRow header="volumes">
                <Container>
                    <Button onClick={() => setVolumes([...volumes, ""])} type="button" value="new" color="#c0c0c0"/>
                    {volumes.map((volume, index) => {
                        const updateVolume = (env: string) => {
                            let me = volumes[index];
                            me = env;
                            volumes[index] = me;
                            setVolumes([...volumes]);
                        }

                        return (
                            <Container key={index} outline="1px solid #5f849b">
                                <InfoRow header="volume mount">
                                    <StyledInput type="text" onChange={(e) => updateVolume(e.target.value)}/>
                                </InfoRow>
                                <Row shiftRight={10}>
                                    <Button onClick={() => setVolumes(envVars.filter((_, i) => i !== index))} type="button" value="remove" color="#c0c0c0"/>
                                </Row>
                            </Container>
                        )
                    })}
                </Container>
            </InfoRow>        
            <Row shiftRight={10}>
                <Button type="button" value="create" color="#c0c0c0" onClick={create} />
                <Button type="button" value="verify" color="#c0c0c0" onClick={verify}/>
            </Row>
        </Container>
        </>
    )
}

export default NewApplication