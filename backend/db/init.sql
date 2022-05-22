CREATE DATABASE spinner_db;

\ c spinner_db;

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
    docker_id varchar(255) null,
    is_updating boolean not null default false
);