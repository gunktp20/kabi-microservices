import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface InvitationAttributes {
  id: string;
  recipient_id: string;
  sender_id: string;
  status?: string;
  board_id: string;
  seen?: boolean;
}

interface InvitationCreationAttributes
  extends Optional<InvitationAttributes, "id"> {}

class Invitation
  extends Model<InvitationAttributes, InvitationCreationAttributes>
  implements InvitationAttributes
{
  public id!: string;
  public recipient_id!: string;
  public sender_id!: string;
  public status!: string;
  public board_id!: string;
  public seen!: boolean;
}

Invitation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    recipient_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM({
        values: ["pending", "accepted", "declined"],
      }),
      defaultValue: "pending",
    },
    board_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    seen: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "invitations",
    timestamps: true,
  }
);

export default Invitation;