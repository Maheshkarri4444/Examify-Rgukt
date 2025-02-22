package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name,omitempty" json:"name"`
	Email     string             `bson:"email" json:"email"`
	GoogleID  string             `bson:"google_id,omitempty" json:"google_id,omitempty"`
	Image     string             `bson:"image,omitempty" json:"image,omitempty"` // Google profile image URL
	Role      string             `bson:"role" json:"role" validate:"oneof=teacher student"`
	CreatedAt primitive.DateTime `json:"created_at" bson:"created_at"`
	UpdatedAt primitive.DateTime `json:"updated_at" bson:"updated_at"`
}
