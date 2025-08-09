import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db/connection";

interface UserAttributes {
  id: string;
  email: string;
  password?: string;
  displayName: string;
  verified?: boolean;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public email!: string;
  public password!: string;
  public displayName!: string;
  public verified!: boolean;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "users",
    timestamps: false,
  }
);

User.sync({ force: false })
  .then(async () => {
    console.log("User table was created in User Service!");
  })
  .catch((err) => {
    console.log(err);
  });

export default User;