import express from 'express';
import Docker from 'dockerode';
import { EntityManager } from '@mikro-orm/postgresql'
import { MikroORM, RequestContext } from '@mikro-orm/core';
import Application from './entities/application';
import axios from 'axios';

const PORT = process.env.PORT;
const DB_NAME = process.env.DB_NAME;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = parseInt(process.env.DB_PORT);
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

const main = async () => {
    const app = express();
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });

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

    app.use((req, res, next) => {
        RequestContext.create(orm.em, next);
    });

    app.get("/api/applications", (req, res) => {
        docker.listContainers({
            all: true
        }).then(containers => {
            orm.em.find(Application, {}).then(apps => {
                res.send(apps);
            });
        });
    });

    app.get("/api/applications/:name", (req, res) => {
        const name = req.params.name;
        orm.em.findOne(Application, { name }).then(app => {
            if (!app) {
                res.sendStatus(404);
                return;
            }

            res.send(app);
        });
    });

    app.get("/api/notify/:id", (req, res) => {
        const id = req.params.id;
        orm.em.findOne(Application, { notification_id: id }).then(application => {
            if (!app) {
                res.sendStatus(404);
                return;
            }

            // docker.buildImage(null, {
            //     t: application.image_tag,
            //     remote: application.
            // }, (err, stream) => {
            //     if (err) {
            //         res.send(err);
            //     } else {
            //         stream.pipe(process.stdout);
            //         res.send("Build started");
            //     }
            // });

            res.send(app);
        });
    });

    app.get("/api/verify", (req, res) => {
        // Query params = repo, dfPath
        if (!req.query.repo || !req.query.dfPath) {
            res.sendStatus(400);
        }

        const gitUrl: string = req.query.repo.toString().replace(".git", "");
        const gitUrlParts = gitUrl.split("/");
        const repoName = gitUrlParts[gitUrlParts.length - 1];
        const repoOwner = gitUrlParts[gitUrlParts.length - 2];

        const dfPath = req.query.dfPath.toString();

        // Check if git repo contains a dockerfile
        // If it does, then return 200, otherwise return bad request (400)
        axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${dfPath}`).then(response => {
            if (res.statusCode === 200) {
                // Dockerfile found
                res.sendStatus(200);
            }
            else {
                // Dockerfile not found
                res.sendStatus(400);
            }
        }).catch(err => {
            res.sendStatus(400);
        });
    })

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

main();