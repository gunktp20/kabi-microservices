import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Assignment from "../models/Assignment";
import { BadRequestError, NotFoundError } from "../errors";

const readAssignments = async (req: Request, res: Response) => {
  await Assignment.update(
    { seen: true },
    {
      where: { assignee_id: req.user?.userId },
    }
  );
  res.status(StatusCodes.OK).json({ msg: "Assignment were read" });
};

const createAssignment = async (req: Request, res: Response) => {
  const { assignee_id, sender_id, task_id, board_id } = req.body;

  if (!assignee_id || !sender_id || !task_id || !board_id) {
    throw new BadRequestError("Please provide all required fields");
  }

  const assignment = await Assignment.create({
    assignee_id,
    sender_id,
    task_id,
    board_id
  });

  res.status(StatusCodes.CREATED).json({ assignment });
};

const deleteAssignmentsByTaskId = async (req: Request, res: Response) => {
  const { task_id } = req.params;

  if (!task_id) {
    throw new BadRequestError("Please provide task_id");
  }

  await Assignment.destroy({
    where: { task_id }
  });

  res.status(StatusCodes.OK).json({ msg: "Assignments deleted successfully" });
};

const getAssignmentByTaskAndUser = async (req: Request, res: Response) => {
  const { task_id, user_id } = req.params;

  console.log("==========================================================================")
  console.log("task_id : " ,task_id)
  console.log("user_id : " ,user_id)
  console.log("==========================================================================")

  if (!task_id || !user_id) {
    throw new BadRequestError("Please provide task_id and user_id");
  }

  const assignment = await Assignment.findOne({
    where: { 
      task_id,
      assignee_id: user_id
    }
  });

  if (!assignment) {
    return res.status(StatusCodes.NOT_FOUND).json({ 
      message: "Assignment not found" 
    });
  }

  res.status(StatusCodes.OK).json({ assignment });
};

const deleteAssignment = async (req: Request, res: Response) => {
  const { assignment_id } = req.params;

  if (!assignment_id) {
    throw new BadRequestError("Please provide assignment_id");
  }

  const assignment = await Assignment.findByPk(assignment_id);

  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  await assignment.destroy();

  res.status(StatusCodes.OK).json({ msg: "Assignment deleted successfully" });
};

export { 
  readAssignments,
  createAssignment,
  deleteAssignmentsByTaskId,
  getAssignmentByTaskAndUser,
  deleteAssignment
};