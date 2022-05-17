CREATE DATABASE IF NOT EXISTS spinner_db;

DROP TABLE IF EXISTS applications;

CREATE TABLE applications (
    name varchar(255) not null primary key,
    image_tag varchar(255) not null,
    github_repo_url varchar(255) not null,
    github_repo_branch varchar(255) not null,
    notification_id varchar(255) not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    docker_file_path varchar(255) not null,
    docker_cmd text not null,
    docker_id varchar(255)
);

INSERT INTO
    applications (
        name,
        image_tag,
        github_repo_url,
        github_repo_branch,
        notification_id,
        created_at,
        updated_at,
        docker_file_path,
        docker_cmd
    )
VALUES
    (
        'Spinner',
        'spinner:latest',
        'https://github.com/dcronqvist/spinner',
        'master',
        'a8e7fbcacf2873fbcaaefcb82d8f9f7f',
        now(),
        now(),
        './Dockerfile',
        '-p 8000:8000 -e ENV_VAR=5'
    );