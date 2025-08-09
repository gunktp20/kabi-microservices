import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db/connection";

interface BoardAttributes {
  id: string;
  board_name: string;
  key: string;
  description?: string;
  owner_id: string;
}

interface BoardCreationAttributes extends Optional<BoardAttributes, "id"> {}

class Board
  extends Model<BoardAttributes, BoardCreationAttributes>
  implements BoardAttributes
{
  public id!: string;
  public board_name!: string;
  public key!: string;
  public description!: string;
  public owner_id!: string;
}

Board.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    board_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "boards",
    timestamps: false,
  }
);

export default Board;