package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name,omitempty" json:"name"`
	Email       string             `bson:"email" json:"email"`
	GoogleID    string             `bson:"google_id,omitempty" json:"google_id,omitempty"`
	Image       string             `bson:"image,omitempty" json:"image,omitempty"` // Google profile image URL
	Role        string             `bson:"role" json:"role" validate:"oneof=teacher student"`
	ContainerID primitive.ObjectID `bson:"contianer_id" json:"container_id"`
	CreatedAt   primitive.DateTime `json:"created_at" bson:"created_at"`
	UpdatedAt   primitive.DateTime `json:"updated_at" bson:"updated_at"`
}

type StudentContainer struct {
	StudentID      primitive.ObjectID `bson:"student_id" json:"student_id"`
	QuestionPapers []struct {
		QuestionPaperID primitive.ObjectID `bson:"question_paper_id" json:"question_paper_id"`
		AnswerSheetID   primitive.ObjectID `bson:"answer_sheet_id" json:"answer_sheet_id"`
	} `bson:"question_papers" json:"question_papers"`
}

type TeacherContainer struct {
	TeacherID primitive.ObjectID `bson:"teacher_id" json:"teacher_id"`
	Exams     []struct {
		ExamID       primitive.ObjectID `bson:"exam_id" json:"exam_id"`
		EvaluationID primitive.ObjectID `bson:"evaluation_id" json:"evaluation_id"`
	} `bson:"exams" json:"exams"`
}
