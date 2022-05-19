import { EnvVar, PortBinding } from "./entities/entities";

export const convertDockerPortBinding = (portBindings: any): PortBinding[] => {
    const bindings: PortBinding[] = [];

    for (const key in portBindings) {
        const binding: PortBinding = {
            container_port: key,
            host_port: portBindings[key][0].HostPort
        };
        bindings.push(binding);
    }

    return bindings;
}

export const convertPortBindingToDocker = (portBindings: PortBinding[]): any => {
    const bindings: any = {};

    portBindings.forEach(pb => {
        bindings[pb.container_port] = [{ HostPort: pb.host_port.toString() }];
    });

    return bindings;
}