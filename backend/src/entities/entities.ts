import { Entity, PrimaryKey, PrimaryKeyType, Property } from "@mikro-orm/core";
import { Container, Port } from "dockerode";
import { convertDockerPortBinding } from "../utils";
import { DOCKER, ORM } from "../index";

export class PortBinding {
    container_port: string;
    host_port: number;

    toDockerPortBinding?(): any {
        return {
            [this.container_port]: [{
                HostPort: this.host_port
            }]
        }
    }
}

export class EnvVar {
    key: string;
    value: string;

    toDockerEnvVar(): any {
        return `${this.key}=${this.value}`;
    }
}

@Entity({ tableName: "applications" })
export default class Application {
    @PrimaryKey()
    name!: string;
    @Property()
    image_tag!: string;
    @Property()
    github_repo_url!: string;
    @Property()
    github_repo_branch!: string;
    @Property()
    notification_id!: string;
    @Property()
    created_at!: Date;
    @Property()
    updated_at!: Date;
    @Property()
    docker_file_path!: string;
    @Property({ nullable: true })
    docker_id: string | null = null;

    // Properties that need evaluating after retrieving from the database
    status: string | null = null;
    is_running: boolean | null = null;
    port_bindings: PortBinding[] = [];
    env_vars: EnvVar[] = [];
    volumes: string[] = [];

    get(): Promise<Application> {
        if (this.docker_id === null) {
            return Promise.resolve(this);
        }

        const container = DOCKER.getContainer(this.docker_id);

        return container.inspect().then(ci => {
            return {
                ...this,
                port_bindings: convertDockerPortBinding(ci.HostConfig.PortBindings),
                env_vars: ci.Config.Env.map(ev => {
                    const e = new EnvVar();
                    e.key = ev.split("=")[0];
                    e.value = ev.split("=")[1];
                    return e;
                }),
                volumes: ci.HostConfig.Binds || [],
                status: ci.State.Status,
                is_running: ci.State.Running
            }
        });
    }
}