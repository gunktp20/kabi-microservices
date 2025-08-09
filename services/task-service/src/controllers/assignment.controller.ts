import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Assignment from "../models/Assignment";

const readAssignments = async (req: Request, res: Response) => {
  await Assignment.update(
    { seen: true },
    {
      where: { assignee_id: req.user?.userId },
    }
  );
  res.status(StatusCodes.OK).json({ msg: "Assignment were read" });
};

const getAssignments = async (req: Request, res: Response) => {
  const assignments = await Assignment.findAll({
    where: { assignee_id: req.user?.userId },
    order: [["createdAt", "DESC"]],
  });
  
  res.status(StatusCodes.OK).json({ assignments });
};

export { readAssignments, getAssignments };