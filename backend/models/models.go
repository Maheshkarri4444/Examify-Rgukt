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
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	QuestionPapers []struct {
		ExamID          primitive.ObjectID `bson:"exam_id" json:"exam_id"`
		QuestionPaperID primitive.ObjectID `bson:"question_paper_id" json:"question_paper_id"`
		AnswerSheetID   primitive.ObjectID `bson:"answer_sheet_id" json:"answer_sheet_id"`
	} `bson:"question_papers" json:"question_papers"`
}

type TeacherContainer struct {
	ID    primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Exams []struct {
		ExamID       primitive.ObjectID `bson:"exam_id" json:"exam_id"`
		EvaluationID primitive.ObjectID `bson:"evaluation_id" json:"evaluation_id"`
	} `bson:"exams" json:"exams"`
}

type Exam struct {
	ID             primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	ExamName       string               `bson:"exam_name" json:"exam_name"`
	ExamType       string               `bson:"exam_type" json:"exam_type" validate:"oneof=external internal viva"`
	AvailableDates []primitive.DateTime `bson:"available_dates" json:"available_dates"`
	Duration       int64                `bson:"duration" json:"duration"` // Duration field added
	Questions      []Question           `bson:"questions" json:"questions"`
	Sets           []primitive.ObjectID `bson:"sets" json:"sets"`
	AnswerSheets   []primitive.ObjectID `bson:"answer_sheets" json:"answer_sheets"`
}

type Question struct {
	Question string   `bson:"question" json:"question"`
	Types    []string `bson:"types" json:"types" validate:"dive,oneof=html css js jquery php nodejs mongodb python java text none"`
	Level    string   `bson:"level" json:"level" validate:"oneof=easy medium hard"`
}

type QuestionPaper struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Set       int                `bson:"set" json:"set"`
	Questions []Question         `bson:"questions" json:"questions"`
}

type AnswerSheet struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	StudentName string             `bson:"student_name" json:"student_name"`
	Email       string             `bson:"email" json:"email"`
	ExamName    string             `bson:"exam_name" json:"exam_name"`
	ExamID      primitive.ObjectID `bson:"exam_id" json:"exam_id"`
	ExamType    string             `bson:"exam_type" json:"exam_type" validate:"oneof=external internal viva"`
	QPaperID    primitive.ObjectID `bson:"qpaper_id" json:"qpaper_id"`
	Set         int                `bson:"set" json:"set"`
	Data        []struct {
		Question string `bson:"question" json:"question"`
		Answers  []struct {
			Type string `bson:"type" json:"type"`
			Ans  string `bson:"ans" json:"ans"`
		} `bson:"answers" json:"answers"`
	} `bson:"data" json:"data"`
	Status    string   `bson:"status" json:"status" validate:"oneof=didnotstart started ended internal"`
	Submitted bool     `bson:"submitted" json:"submitted" default:"false"`
	AIScore   *float64 `bson:"ai_score,omitempty" json:"ai_score,omitempty"`
	Duration  int64    `bson:"duration" json:"duration"` // Duration field added
}

type Evaluation struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	AnswerSheetID primitive.ObjectID `bson:"answer_sheet_id" json:"answer_sheet_id"`
	StudentName   string             `bson:"student_name" json:"student_name"`
	Email         string             `bson:"email" json:"email"`
	ExamName      string             `bson:"exam_name" json:"exam_name"`
	QPaperID      primitive.ObjectID `bson:"qpaper_id" json:"qpaper_id"`
	Set           int                `bson:"set" json:"set"`
	AIScore       *float64           `bson:"ai_score,omitempty" json:"ai_score,omitempty"`
	Data          []struct {
		Question string `bson:"question" json:"question"`
		Answers  []struct {
			Type string `bson:"type" json:"type"`
			Ans  string `bson:"ans" json:"ans"`
		} `bson:"answers" json:"answers"`
		AIEvaluation string `bson:"ai_evaluation" json:"ai_evaluation"`
		Marks        int    `bson:"marks" json:"marks"`
	} `bson:"data" json:"data"`
	TotalMarks int `bson:"total_marks" json:"total_marks"`
}
