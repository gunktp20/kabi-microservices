import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db/connection";

interface BoardMembersAttributes {
  id: string;
  user_id: string;
  board_id: string;
}

interface BoardMembersCreationAttributes extends Optional<BoardMembersAttributes, "id"> {}

class BoardMembers
  extends Model<BoardMembersAttributes, BoardMembersCreationAttributes>
  implements BoardMembersAttributes
{
  public id!: string;
  public user_id!: string;
  public board_id!: string;
}

BoardMembers.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    board_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "board_members",
    timestamps: false,
  }
);

export default BoardMembers;