import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db/connection";

interface ColumnAttributes {
  id: string;
  column_name: string;
  board_id: string;
  sequence?: number;
}

interface ColumnCreationAttributes extends Optional<ColumnAttributes, "id"> {}

class Column
  extends Model<ColumnAttributes, ColumnCreationAttributes>
  implements ColumnAttributes
{
  public id!: string;
  public column_name!: string;
  public board_id!: string;
  public sequence!: number;
}

Column.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    column_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    board_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "columns",
    timestamps: false,
    hooks: {
      async beforeCreate(column, options) {
        const maxSequence: number = await Column.max("sequence", {
          where: { board_id: column.board_id },
        });
        column.sequence = maxSequence ? maxSequence + 1 : 1;
      },
    },
  }
);

export default Column;