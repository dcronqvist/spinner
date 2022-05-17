import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

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

    // The idea is that the command will be surrounded by
    // docker run ${docker_cmd} ${image_tag}
    @Property()
    docker_cmd!: string;

    @Property()
    docker_id: string | null = null;
}