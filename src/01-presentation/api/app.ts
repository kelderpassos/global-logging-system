import express, { Express } from 'express';
import serverless from 'serverless-http';
import { router } from './routes/router';

export class App {
  public app: Express;
  public domainPath = 'logging-service';

  constructor() {
    this.app = express();
    this.app.use(express.json());

    this.routes();
  }

  private routes = () => {
    this.app.use(`/teste`, router);
  };

  public start = (port: number) => {
    this.app.listen(port, () => console.log(`Listening on port ${port}`));
  };
}

const server = new App();
server.start(5555);

export const { app, domainPath } = new App();
export const handler = serverless(app);
