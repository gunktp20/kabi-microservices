import Board from "./Board";
import Column from "./Column";
import BoardMembers from "./BoardMembers";

// Define model associations for board-service
// This file contains all the relationships between models in this service

// Board associations
Board.hasMany(BoardMembers, { foreignKey: "board_id" });
Board.hasMany(Column, { foreignKey: "board_id", sourceKey: "id" });

// BoardMembers associations  
BoardMembers.belongsTo(Board, { foreignKey: "board_id" });

// Column associations
Column.belongsTo(Board, { foreignKey: "board_id" });

export { Board, Column, BoardMembers };