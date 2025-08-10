import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
  UnAuthenticatedError,
} from "../errors";
import Task from "../models/Task";
import "express-async-errors";
import axios from "axios";
import { REALTIME_SERVICE_URL } from "../config/application.config";
import boardService from "../services/boardService";
import notificationService from "../services/notificationService";
import userService from "../services/userService";

const createTask = async (req: Request, res: Response) => {
  const { description, board_id, column_id } = req.body;
  if (
    !description ||
    !column_id ||
    !board_id ||
    typeof req.user?.userId === "undefined"
  ) {
    throw new BadRequestError("Please provide all value");
  }

  try {
    const boardMember = await boardService.checkBoardMembership(
      board_id,
      req.user.userId,
      req.headers.authorization
    );

    if (!boardMember) {
      throw new UnAuthenticatedError("you are not board member");
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new UnAuthenticatedError("you are not board member");
    }
    throw error;
  }

  try {
    const newTask = await Task.create({
      description,
      board_id,
      column_id,
      assignee_id: req.user.userId,
    });

    const task = await Task.findOne({
      where: { id: newTask.id },
    });

    try {
      await axios.post(`${REALTIME_SERVICE_URL}/api/v1/events/task-created`, {
        taskId: task?.id,
        boardId: board_id,
        userId: req.user.userId,
      });
    } catch (error) {
      console.error("Failed to emit task created event:", error);
    }

    return res.status(StatusCodes.CREATED).json(task);
  } catch (err) {
    throw err;
  }
};

const getTasksByBoardId = async (req: Request, res: Response) => {
  try {
    const boardMember = await boardService.checkBoardMembership(
      req.params.board_id,
      req.user?.userId || '',
      req.headers.authorization
    );

    if (!boardMember) {
      throw new UnAuthenticatedError("you are not board member");
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new UnAuthenticatedError("you are not board member");
    }
    throw error;
  }

  try {
    const tasks = await Task.findAll({
      where: { board_id: req.params.board_id },
      order: [["position", "ASC"]],
    });
    return res.status(StatusCodes.OK).json(tasks);
  } catch (err) {
    throw err;
  }
};

const updateTasksOrder = async (req: Request, res: Response) => {
  const { board_id } = req.params;
  const { tasks_order } = req.body;
  if (
    !board_id ||
    !tasks_order ||
    tasks_order.length <= 0 ||
    typeof req.user?.userId === "undefined"
  ) {
    throw new NotFoundError("Please provide all value");
  }
  try {
    const boardMember = await boardService.checkBoardMembership(
      board_id,
      req.user.userId,
      req.headers.authorization
    );

    if (!boardMember) {
      throw new UnAuthenticatedError("you are not board member");
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new UnAuthenticatedError("you are not board member");
    }
    throw error;
  }

  await Promise.all(
    req.body.tasks_order.map(
      async (
        task: { id: string; board_id: string; column_id: string },
        i: number
      ) => {
        if (task.board_id !== board_id) {
          throw new UnAuthenticatedError("tasks order is not valid");
        }
        await Task.update(
          { position: i + 1, column_id: task.column_id },
          {
            where: {
              id: task.id,
            },
          }
        );
      }
    )
  );

  try {
    await axios.post(`${REALTIME_SERVICE_URL}/api/v1/events/tasks-reordered`, {
      boardId: board_id,
      tasksOrder: tasks_order,
      userId: req.user.userId,
    });
  } catch (error) {
    console.error("Failed to emit tasks reordered event:", error);
  }

  res.status(StatusCodes.OK).json({ msg: "updated tasks order" });
};

const updateTaskDescription = async (req: Request, res: Response) => {
  const { description } = req.body;
  const { task_id } = req.params;

  if (!description) {
    throw new BadRequestError("Please provide task description");
  }

  const task = await Task.findOne({
    where: { id: task_id },
  });

  if (!task) {
    throw new NotFoundError("Not found task with id " + task_id);
  }

  try {
    const boardMember = await boardService.checkBoardMembership(
      task.board_id,
      req.user?.userId || '',
      req.headers.authorization
    );

    if (!boardMember) {
      throw new UnAuthenticatedError("you are not board member");
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new UnAuthenticatedError("you are not board member");
    }
    throw error;
  }

  task.description = description;
  await task.save();

  try {
    await axios.post(`${REALTIME_SERVICE_URL}/api/v1/events/task-updated`, {
      taskId: task.id,
      boardId: task.board_id,
      userId: req.user?.userId,
    });
  } catch (error) {
    console.error("Failed to emit task updated event:", error);
  }

  res.status(StatusCodes.OK).json({ msg: " updated your task description" });
};

const deleteTaskById = async (req: Request, res: Response) => {
  const { task_id } = req.params;
  if (!task_id || typeof req.user?.userId === "undefined") {
    throw new NotFoundError("Please provide all value");
  }
  const task = await Task.findOne({ where: { id: task_id } });
  if (!task) {
    throw new NotFoundError("Not found your task");
  }
  try {
    const boardMember = await boardService.checkBoardMembership(
      task?.board_id || '',
      req.user.userId,
      req.headers.authorization
    );

    if (!boardMember) {
      throw new UnAuthenticatedError("you are not board member");
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new UnAuthenticatedError("you are not board member");
    }
    throw error;
  }
  
  try {
    await notificationService.deleteAssignmentsByTaskId(
      task_id,
      req.headers.authorization
    );
  } catch (error) {
    console.error('Failed to delete assignments:', error);
  }
  await Task.destroy({
    where: { id: task_id },
  });

  try {
    await axios.post(`${REALTIME_SERVICE_URL}/api/v1/events/task-deleted`, {
      taskId: task_id,
      boardId: task.board_id,
      userId: req.user.userId,
    });
  } catch (error) {
    console.error("Failed to emit task deleted event:", error);
  }

  res.status(StatusCodes.OK).json({ msg: "Deleted your task" });
};

const assignToMember = async (req: Request, res: Response) => {
  const { task_id } = req.params;
  const { recipient_email } = req.body;

  if (!recipient_email || typeof req.user?.userId === "undefined") {
    throw new BadRequestError("Please provide all value");
  }

  const task = await Task.findOne({
    where: { id: task_id },
  });
  
  if (!task) {
    throw new NotFoundError("Not found your task");
  }

  try {
    const userResponse = await userService.getUserByEmail(
      recipient_email,
      req.headers.authorization
    );
    const recipientUser = userResponse.user;

    if (task.assignee_id === recipientUser?.id) {
      return res.status(StatusCodes.OK).json({ msg: "task was assigned" });
    }

    if (!recipientUser) {
      throw new NotFoundError("Not found recipient user");
    }

    const senderBoardMember = await boardService.checkBoardMembership(
      task.board_id,
      req.user?.userId || '',
      req.headers.authorization
    );

    if (!senderBoardMember) {
      throw new UnAuthenticatedError("you are not board member");
    }

    const recipientBoardMember = await boardService.checkBoardMembership(
      task.board_id,
      recipientUser?.id || '',
      req.headers.authorization
    );

    if (!recipientBoardMember) {
      throw new UnAuthenticatedError("recipient user is not board member");
    }

    if (recipientUser?.id === task.assignee_id) {
      return res.status(StatusCodes.OK).json({ msg: "task was assigned" });
    }

    await Task.update(
      {
        assignee_id: recipientUser?.id,
      },
      {
        where: { id: task_id },
      }
    );

    if (recipientUser?.id === req.user.userId) {
      return res.status(StatusCodes.OK).json({ msg: "task was assigned" });
    }

    const oldAssignment = await notificationService.getAssignmentByTaskAndUser(
      task_id,
      recipientUser?.id || '',
      req.headers.authorization
    );

    if (oldAssignment) {
      await notificationService.deleteAssignment(
        oldAssignment.id,
        req.headers.authorization
      );
    }

    await notificationService.createAssignment({
      assignee_id: recipientUser?.id || '',
      sender_id: req.user?.userId || '',
      task_id: task.id,
      board_id: task.board_id
    }, req.headers.authorization);

    try {
      await axios.post(`${REALTIME_SERVICE_URL}/api/v1/events/task-assigned`, {
        taskId: task.id,
        assigneeId: recipientUser.id,
        senderId: req.user.userId,
        boardId: task.board_id,
        taskDescription: task.description,
      });
    } catch (error) {
      console.error("Failed to emit task assigned event:", error);
    }

    res.status(StatusCodes.OK).json({ msg: "task was assigned" });
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new NotFoundError("Not found recipient user");
    }
    throw error;
  }
};

export {
  createTask,
  getTasksByBoardId,
  deleteTaskById,
  updateTasksOrder,
  updateTaskDescription,
  assignToMember,
};