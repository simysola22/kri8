import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import ideasRouter from "./ideas";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/ideas", ideasRouter);
router.use("/profile", profileRouter);

export default router;
