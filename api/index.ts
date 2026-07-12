import serverless from "serverless-http";
import { createApp } from "../server/_core/index";

export default serverless(createApp());
