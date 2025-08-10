import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db/connection";

interface RefreshTokenAttributes {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  revoked?: boolean;
  revoked_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface RefreshTokenCreationAttributes extends Optional<RefreshTokenAttributes, "id"> {}

class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  public id!: string;
  public user_id!: string;
  public token!: string;
  public expires_at!: Date;
  public revoked!: boolean;
  public revoked_at!: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    token: {
      type: DataTypes.STRING(512),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "refresh_tokens",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['token']
      },
      {
        fields: ['expires_at']
      }
    ]
  }
);

RefreshToken.sync({ force: false })
  .then(async () => {
    console.log("RefreshToken table was created!");
  })
  .catch((err) => {
    console.log("RefreshToken table creation error:", err);
  });

export default RefreshToken;