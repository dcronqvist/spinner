import express from 'express';
import bodyParser from 'body-parser';
import Docker, { Container, ContainerInfo } from 'dockerode';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { EnvVar, PortBinding, Application } from './entities/entities';
import axios from 'axios';
import crypto from 'crypto';
import { convertPortBindingToDocker } from './utils';
import waitPort from 'wait-port';
import fs from 'fs';

export const DOCKER = new Docker({ socketPath: '/var/run/docker.sock' });
export let ORM: MikroORM = null;

const PORT = 8080;
const DB_NAME = process.env.DB_NAME;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = parseInt(process.env.DB_PORT);
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const CADDY_CONTAINER_NAME = process.env.CADDY_CONTAINER_NAME;

const getCaddyContainer = async (): Promise<Container> => {
    return DOCKER.listContainers().then(containers => {
        const caddyContainer = containers.find(c => c.Names[0].includes(CADDY_CONTAINER_NAME))
        if (caddyContainer) {
            return DOCKER.getContainer(caddyContainer.Id);
        }
        else {
            return Promise.reject('Caddy container not found');
        }
    })
}


const main = async () => {
    await waitPort({ host: DB_HOST, port: DB_PORT });

    const app = express();

    const orm = await MikroORM.init({
        entitiesTs: ["src/entities/**/*.ts"],
        entities: ["dist/entities/**/*.js"],
        dbName: DB_NAME,
        type: "postgresql",
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        debug: true,
    });

    ORM = orm;

    app.use((req, res, next) => {
        RequestContext.create(orm.em, next);
    });

    // app.use((req, res, next) => {
    //     if (!req.url.startsWith('/api/notify')) {
    //         // Require that the request has a valid auth token
    //         const authHeader = req.headers.authorization;

    //         if (!authHeader) {
    //             return res.status(401).send('Unauthorized');
    //         }

    //         if (authHeader !== process.env.AUTH_TOKEN) {
    //             return res.status(401).send('Unauthorized');
    //         }
    //     }
    //     return next();
    // });

    app.use(bodyParser.json());

    app.get("/api/applications", (req, res) => {
        orm.em.find(Application, {}).then(apps => {
            if (!apps) {
                res.status(404).send("No applications found");
                return;
            }

            const evaledApps = apps.map(a => a.get());
            Promise.all(evaledApps).then(a => {
                res.json(a);
            });
        });
    });

    app.post("/api/applications", async (req, res) => {
        console.log("Creating application");
        /*
        body: {
            name,
            image_tag,
            repo_owner,
            repo_name,
            repo_branch,
            docker_file_path,
            port_bindings,
            env_vars,
            volumes,
        }
        */

        const { name, image_tag, repo_owner, repo_name, repo_branch, docker_file_path, port_bindings, env_vars, volumes } = req.body;

        // Begin by checking if an application with that name already exists
        const exists = await orm.em.findOne(Application, { name }).then(app => {
            if (app) {
                res.status(400).json({
                    error: "Application with that name already exists"
                });
                console.log("Application with that name already exists");
                return true;
            }

            return false;
        });
        if (exists)
            return;

        console.log("Name doesn't exist yet");

        const notification_id = crypto.randomUUID(); // needs to be generated somehow

        const application = new Application();
        application.name = name;
        application.image_tag = image_tag;
        application.github_repo_url = `https://github.com/${repo_owner}/${repo_name}.git`;
        application.github_repo_branch = repo_branch;
        application.notification_id = notification_id;
        application.docker_file_path = docker_file_path;
        application.created_at = new Date();
        application.updated_at = new Date();
        application.is_updating = false;

        // Create the port bindings
        const portBindings: PortBinding[] = port_bindings.map((pb: any) => {
            const portBinding = new PortBinding();
            portBinding.container_port = pb.container_port;
            portBinding.host_port = pb.host_port;
            return portBinding;
        });

        // Create the envvars
        const envVars: EnvVar[] = env_vars.map((ev: any) => {
            const split = ev.split("=");
            const envVar = new EnvVar();
            envVar.key = split[0];
            envVar.value = split.slice(1).join("=");
            return envVar;
        });

        orm.em.persistAndFlush(application).then(() => {
            application.get().then(a => {
                res.json(a);
            });
        });

        console.log(`Building image ${application.image_tag}`);
        DOCKER.buildImage(null, {
            t: application.image_tag,
            remote: application.github_repo_url + "#" + application.github_repo_branch + (application.docker_file_path === "" ? "" : ":" + application.docker_file_path)
        }, (err, stream) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
                return;
            } else {
                stream.pipe(process.stdout);
                console.log("Image built.");

                console.log("Creating container...");
                const ops: Docker.ContainerCreateOptions = {
                    name: application.name,
                    Image: application.image_tag,
                    Env: envVars.map(ev => ev.toDockerEnvVar()),
                    HostConfig: {
                        PortBindings: convertPortBindingToDocker(portBindings),
                        Binds: volumes
                    },
                };
                console.log(ops);
                DOCKER.createContainer(ops).then(container => {
                    console.log(`Container created with id ${container.id}.`);

                    container.start().then(() => {
                        application.docker_id = container.id;
                        orm.em.persistAndFlush(application);
                    })

                }).catch(err => {
                    console.log(err);
                }).finally(() => {
                    console.log("finally reached!");
                })
            }
        });
    });

    app.get("/api/applications/:name", (req, res) => {
        const name = req.params.name;
        orm.em.findOne(Application, { name }).then(app => {
            if (!app) {
                res.sendStatus(404);
                return;
            }

            app.get().then(a => {
                res.json(a);
            });
        });
    });

    app.delete("/api/applications/:name", (req, res) => {
        const name = req.params.name;
        orm.em.findOne(Application, { name }).then(application => {
            if (!application) {
                res.sendStatus(404);
                return;
            }

            application.get().then(async a => {
                if (a.status === "container_not_found") {
                    orm.em.removeAndFlush(application);
                    res.sendStatus(200);
                    return;
                }

                const container = DOCKER.getContainer(a.docker_id);
                container.inspect().then(ci => {
                    // Check if it is running and then remove container & from database
                    if (ci.State.Running) {
                        container.stop().then(() => {
                            container.remove({ force: true }).then(() => {
                                orm.em.removeAndFlush(application);
                                res.sendStatus(200);
                            })
                        });
                    } else {
                        container.remove({ force: true }).then(() => {
                            orm.em.removeAndFlush(application);
                            res.sendStatus(200);
                        })
                    }
                }).catch(err => {
                    // Doesn't exist, just remove from database
                    orm.em.removeAndFlush(application);
                    res.sendStatus(200);
                })
            });
        });
    });

    app.get("/api/applications/:name/start", (req, res) => {
        // Start the application's docker container
        const name = req.params.name;
        orm.em.findOne(Application, { name }).then(app => {
            if (!app) {
                res.sendStatus(404);
                return;
            }

            const container = DOCKER.getContainer(app.docker_id);

            container.start().then(() => {
                res.sendStatus(200);
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
        });
    })

    app.get("/api/applications/:name/stop", (req, res) => {
        // Start the application's docker container
        const name = req.params.name;
        orm.em.findOne(Application, { name }).then(app => {
            if (!app) {
                res.sendStatus(404);
                return;
            }

            const container = DOCKER.getContainer(app.docker_id);

            container.stop().then(() => {
                res.sendStatus(200);
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
        });
    });

    app.get("/api/applications/:name/pause", (req, res) => {
        // Pause the application's docker container
        const name = req.params.name;
        orm.em.findOne(Application, { name }).then(app => {
            if (!app) {
                res.sendStatus(404);
                return;
            }

            const container = DOCKER.getContainer(app.docker_id);

            container.pause().then(() => {
                res.sendStatus(200);
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
        });
    });

    app.get("/api/applications/:name/unpause", (req, res) => {
        // Unpause the application's docker container
        const name = req.params.name;
        orm.em.findOne(Application, { name }).then(app => {
            if (!app) {
                res.sendStatus(404);
                return;
            }

            const container = DOCKER.getContainer(app.docker_id);

            container.unpause().then(() => {
                res.sendStatus(200);
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
        });
    });

    app.get("/api/applications/:name/restart", (req, res) => {
        // Restart the application's docker container
        const name = req.params.name;

        orm.em.findOne(Application, { name }).then(app => {
            if (!app) {
                res.sendStatus(404);
                return;
            }

            const container = DOCKER.getContainer(app.docker_id);

            container.restart().then(() => {
                res.sendStatus(200);
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
        });
    });

    app.get("/api/applications/:name/newtoken", (req, res) => {
        // Generate a new token for the application
        const name = req.params.name;

        orm.em.findOne(Application, { name }).then(application => {
            if (!application) {
                res.sendStatus(404);
                return;
            }

            application.notification_id = crypto.randomUUID();

            orm.em.persistAndFlush(application).then(() => {
                res.json(application);
            });
        });
    });

    app.get("/api/applications/:name/logs", (req, res) => {
        /* body = {
            lines,
            timestamps
        } */

        const { lines, timestamps } = req.query as { lines: string, timestamps: string };

        // Get the logs of the application's docker container
        const name = req.params.name;

        orm.em.findOne(Application, { name }).then(async app => {
            if (!app) {
                res.sendStatus(404);
                return;
            }

            const container = DOCKER.getContainer(app.docker_id);

            res.setHeader("Content-Type", "text/plain");

            const logs: Buffer = await container.logs({ follow: false, stdout: true, stderr: true, tail: parseInt(lines) || 100, timestamps: timestamps != undefined }) as unknown as Buffer;

            // Unsure of why this is necessary, but it is.
            res.write(logs.toString().split("\n").map(l => l.substring(8)).join("\n"));

            res.send();
        });
    });

    app.get("/api/notify/:id", (req, res) => {
        const id = req.params.id;
        orm.em.findOne(Application, { notification_id: id }).then(application => {
            if (!application) {
                res.sendStatus(404);
                return;
            }

            res.sendStatus(200);

            console.log(`Notifying ${application.name} of new build.`);

            // Set is_updating in database to true (makes visible to frontend)
            application.is_updating = true;
            orm.em.persistAndFlush(application);

            application.get().then(appli => {
                const envVars = appli.env_vars;
                const portBindings = appli.port_bindings;
                const volumes = appli.volumes;

                // Build new image
                DOCKER.buildImage(null, {
                    t: appli.image_tag,
                    remote: appli.github_repo_url + "#" + appli.github_repo_branch + (appli.docker_file_path === "" ? "" : ":" + appli.docker_file_path)
                }, (err, stream) => {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        stream.pipe(process.stdout);
                        console.log("Image updated.");

                        const container = DOCKER.getContainer(appli.docker_id);

                        // Stop old container
                        console.log("Stopping old container...");
                        container.stop().then(() => {
                            // Remove old container
                            console.log("Removing old container...");
                            container.remove().then(() => {
                                // Create new container with new image
                                console.log("Creating new container...");
                                const ops: Docker.ContainerCreateOptions = {
                                    name: application.name,
                                    Image: application.image_tag,
                                    Env: envVars.map(ev => ev.toDockerEnvVar()),
                                    HostConfig: {
                                        PortBindings: convertPortBindingToDocker(portBindings),
                                        Binds: volumes
                                    },
                                };
                                console.log(ops);
                                DOCKER.createContainer(ops).then(container => {
                                    console.log(`Container created with id ${container.id}.`);

                                    application.docker_id = container.id;
                                    application.updated_at = new Date();
                                    container.start();
                                }).catch(err => {
                                    console.log(err);
                                }).finally(() => {
                                    console.log("finally reached!");
                                    application.is_updating = false;
                                    orm.em.persistAndFlush(application);
                                })
                            });
                        }).catch(err => {
                            console.log(err);
                        }).finally(() => {
                            console.log("finally reached!");
                            application.is_updating = false;
                            orm.em.persistAndFlush(application);
                        })
                    }
                });

                // Start new container
            });
        });
    });

    app.post("/api/notify", (req, res) => {
        const id = req.body.id;
        orm.em.findOne(Application, { notification_id: id }).then(application => {
            if (!application) {
                res.sendStatus(404);
                return;
            }

            res.sendStatus(200);

            console.log(`Notifying ${application.name} of new build.`);

            // Set is_updating in database to true (makes visible to frontend)
            application.is_updating = true;
            orm.em.persistAndFlush(application);

            application.get().then(appli => {
                const envVars = appli.env_vars;
                const portBindings = appli.port_bindings;
                const volumes = appli.volumes;

                // Build new image
                DOCKER.buildImage(null, {
                    t: appli.image_tag,
                    remote: appli.github_repo_url + "#" + appli.github_repo_branch + (appli.docker_file_path === "" ? "" : ":" + appli.docker_file_path)
                }, (err, stream) => {
                    if (err) {
                        console.log(err);
                        res.sendStatus(500);
                        return;
                    } else {
                        stream.pipe(process.stdout);
                        console.log("Image updated.");

                        const container = DOCKER.getContainer(appli.docker_id);

                        // Stop old container
                        console.log("Stopping old container...");
                        container.stop().then(() => {
                            // Remove old container
                            console.log("Removing old container...");
                            container.remove().then(() => {
                                // Create new container with new image
                                console.log("Creating new container...");
                                const ops: Docker.ContainerCreateOptions = {
                                    name: application.name,
                                    Image: application.image_tag,
                                    Env: envVars.map(ev => ev.toDockerEnvVar()),
                                    HostConfig: {
                                        PortBindings: convertPortBindingToDocker(portBindings),
                                        Binds: volumes
                                    },
                                };
                                console.log(ops);
                                DOCKER.createContainer(ops).then(container => {
                                    console.log(`Container created with id ${container.id}.`);
                                    application.docker_id = container.id;
                                    application.updated_at = new Date();
                                }).catch(err => {
                                    console.log(err);
                                }).finally(() => {
                                    console.log("finally reached!");
                                    application.is_updating = false;
                                    orm.em.persistAndFlush(application);
                                })
                            }).catch(err => {

                            }).finally(() => {
                                application.is_updating = false;
                                orm.em.persistAndFlush(application);
                            })
                        });


                    }
                });

                // Start new container
            });
        });
    })

    app.get("/api/verify", (req, res) => {
        console.log("Verifying...");
        // Query params = owner, repo, branch, path
        if (!req.query.owner || !req.query.repo || !req.query.branch) {
            res.status(400).send("Missing query params");
            console.log("Missing query params");
            return;
        }

        const owner = req.query.owner;
        const repo = req.query.repo;
        const branch = req.query.branch;
        const path = req.query.path === undefined ? "" : req.query.path + "/";

        // Check if git repo contains a dockerfile
        // If it does, then return 200, otherwise return bad request (400)
        axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}Dockerfile?ref=${branch}`).then(response => {
            if (res.statusCode === 200) {
                // Dockerfile found
                console.log("Dockerfile found.");
                res.sendStatus(200);
            }
            else {
                // Dockerfile not found
                console.log("Dockerfile not found.");
                res.sendStatus(400);
            }
        }).catch(err => {
            console.log(err);
            res.sendStatus(400);
        });
    })

    app.get("/api/caddy", (req, res) => {
        getCaddyContainer().then(container => {
            fs.readFile("/app/Caddyfile", "utf8", (err, data) => {
                if (err) {
                    console.log(err);
                    res.sendStatus(500);
                    return;
                }

                res.send(data);
            })
        }).catch(err => {
            res.sendStatus(500);
        })
    })

    app.post("/api/caddy", (req, res) => {
        /*
        body = {
            caddyfile: string
        }
        */
        if (!req.body.caddyfile) {
            res.sendStatus(400);
            return;
        }

        const caddyfile = req.body.caddyfile;

        getCaddyContainer().then(container => {
            fs.writeFile("/app/Caddyfile", caddyfile, err => {
                if (err) {
                    console.log(err);
                    res.sendStatus(500);
                    return;
                }

                res.sendStatus(200);
            })
        }).catch(err => {
            res.sendStatus(500);
        })
    })

    app.get("/api/caddy/reload", (req, res) => {
        getCaddyContainer().then(container => {
            container.exec({
                WorkingDir: "/etc/caddy",
                Cmd: ["caddy", "reload"]
            }).then(exec => {
                exec.start({}).then(() => {
                    res.sendStatus(200);
                })
            }).catch(err => {
                console.log(err);
                res.sendStatus(500);
            })
        }).catch(err => {
            res.sendStatus(500);
        })
    })

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

main();