export interface DemoService {
  name: string;
  status: DemoStates;
  running_time: string;
  pr_url: string;
  host: string;
}

export enum DemoStates {
  RUNNING = "running",
  BUILDING = "building",
  FAILED = "failed",
}

export enum DemoUpdateStates {
  RESTART = "restart",
  DELETE = "delete",
}
