export interface PortBinding {
    container_port: string;
    host_port: number;

}

export interface EnvVar {
    key: string;
    value: string;
}

export interface Application {
    name: string;
    image_tag: string;
    github_repo_url: string;
    github_repo_branch: string;
    notification_id: string;
    created_at: Date;
    updated_at: Date;
    docker_file_path: string;
    docker_id: string | null;
    is_updating: boolean;
    latest_logs: string;

    status: string | null;
    is_running: boolean;
    port_bindings: PortBinding[];
    env_vars: EnvVar[];
    volumes: string[];
}