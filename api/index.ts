import serverless from "serverless-http";
import { createApp } from "../dist/index.js";

export default serverless(createApp());
