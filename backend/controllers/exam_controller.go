package controllers

import (
	"context"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"github.com/Maheshkarri4444/Examify/config"
	"github.com/Maheshkarri4444/Examify/models"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var examCollection *mongo.Collection = config.GetCollection(config.Client, "exams")

func CreateExam(c *gin.Context) {
	var exam models.Exam
	if err := c.ShouldBindJSON(&exam); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set empty fields
	exam.ID = primitive.NewObjectID()
	exam.Sets = []primitive.ObjectID{}
	exam.AnswerSheets = []primitive.ObjectID{}

	// Insert into DB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_, err := examCollection.InsertOne(ctx, exam)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create exam"})
		return
	}

	// Add exam ID to teacher's container
	containerID := c.MustGet("container_id").(primitive.ObjectID)
	filter := bson.M{"_id": containerID}
	update := bson.M{"$push": bson.M{"exams": bson.M{"exam_id": exam.ID}}}
	_, err = teacherContainerCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update teacher container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Exam created successfully", "exam_id": exam.ID})
}

func UpdateExam(c *gin.Context) {
	var exam models.Exam
	if err := c.ShouldBindJSON(&exam); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	filter := bson.M{"_id": exam.ID}
	update := bson.M{
		"$set": bson.M{
			"exam_name":       exam.ExamName,
			"exam_type":       exam.ExamType,
			"available_dates": exam.AvailableDates,
			"duration":        exam.Duration,
			"questions":       exam.Questions,
		},
	}
	_, err := examCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update exam"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Exam updated successfully"})
}

func GetAllExams(c *gin.Context) {
	var exams []models.Exam
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := examCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch exams"})
		return
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var exam models.Exam
		if err := cursor.Decode(&exam); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding exam"})
			return
		}
		exams = append(exams, exam)
	}

	c.JSON(http.StatusOK, exams)
}

func GetExamById(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Query("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid exam ID"})
		return
	}

	var exam models.Exam
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	err = examCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&exam)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Exam not found"})
		return
	}

	c.JSON(http.StatusOK, exam)
}

func GetExamsByTeacherContainer(c *gin.Context) {
	containerID := c.MustGet("container_id").(primitive.ObjectID)
	var teacherContainer struct {
		Exams []struct {
			ExamID primitive.ObjectID `bson:"exam_id"`
		} `bson:"exams"`
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	err := teacherContainerCollection.FindOne(ctx, bson.M{"_id": containerID}).Decode(&teacherContainer)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Teacher container not found"})
		return
	}
	fmt.Println("teacher container: ", teacherContainer)
	examIDs := make([]primitive.ObjectID, len(teacherContainer.Exams))
	for i, e := range teacherContainer.Exams {
		examIDs[i] = e.ExamID
	}

	var exams []models.Exam
	cursor, err := examCollection.Find(ctx, bson.M{"_id": bson.M{"$in": examIDs}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch exams"})
		return
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var exam models.Exam
		if err := cursor.Decode(&exam); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding exam"})
			return
		}
		exams = append(exams, exam)
	}
	fmt.Println("exams: ", exams)
	c.JSON(http.StatusOK, exams)
}

var questionPaperCollection *mongo.Collection = config.GetCollection(config.Client, "question_papers")

type CreateSetsRequest struct {
	ExamID  string `json:"exam_id" binding:"required"`
	NumSets int    `json:"num_sets" binding:"required"`
	Hard    int    `json:"hard" binding:"required"`
	Medium  int    `json:"medium" binding:"required"`
	Easy    int    `json:"easy" binding:"required"`
}

func CreateSetsForExam(c *gin.Context) {
	var req CreateSetsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert ExamID to ObjectID
	examID, err := primitive.ObjectIDFromHex(req.ExamID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Exam ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Fetch exam from DB
	var exam models.Exam
	fmt.Println("examid: ", examID)
	err = examCollection.FindOne(ctx, bson.M{"_id": examID}).Decode(&exam)
	fmt.Println("exam: ", exam)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Exam not found"})
		return
	}

	// Categorize questions by difficulty level
	hardQ, mediumQ, easyQ := []models.Question{}, []models.Question{}, []models.Question{}
	for _, q := range exam.Questions {
		switch q.Level {
		case "hard":
			hardQ = append(hardQ, q)
		case "medium":
			mediumQ = append(mediumQ, q)
		case "easy":
			easyQ = append(easyQ, q)
		}
	}

	// Check if enough questions exist
	if len(hardQ) < req.Hard || len(mediumQ) < req.Medium || len(easyQ) < req.Easy {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Not enough questions available for the given criteria"})
		return
	}

	var createdSets []primitive.ObjectID

	// Create Sets
	for i := 1; i <= req.NumSets; i++ {
		// Randomly select questions
		selectedQuestions := []models.Question{}
		selectedQuestions = append(selectedQuestions, getRandomQuestions(hardQ, req.Hard)...)
		selectedQuestions = append(selectedQuestions, getRandomQuestions(mediumQ, req.Medium)...)
		selectedQuestions = append(selectedQuestions, getRandomQuestions(easyQ, req.Easy)...)

		// Create Question Paper
		questionPaper := models.QuestionPaper{
			ID:        primitive.NewObjectID(),
			Set:       i,
			Questions: selectedQuestions,
		}

		// Insert into DB
		_, err := questionPaperCollection.InsertOne(ctx, questionPaper)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create question paper"})
			return
		}

		// Store Question Paper ID
		createdSets = append(createdSets, questionPaper.ID)
	}
	_, err = examCollection.UpdateOne(ctx, bson.M{"_id": examID}, bson.M{"$set": bson.M{"sets": []primitive.ObjectID{}}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset existing question paper sets"})
		return
	}
	// Update Exam Document with Created Sets
	_, err = examCollection.UpdateOne(ctx, bson.M{"_id": examID}, bson.M{"$set": bson.M{"sets": createdSets}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update exam with question paper sets"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Question papers created successfully", "sets": createdSets})
}

// Helper function to randomly select N questions from a list
func getRandomQuestions(questions []models.Question, count int) []models.Question {
	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(questions), func(i, j int) { questions[i], questions[j] = questions[j], questions[i] })
	return questions[:count]
}

func GetQuestionPaperByID(c *gin.Context) {
	// Get the question paper ID from the URL
	qpaperID := c.Param("id")

	// Convert string ID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(qpaperID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question paper ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Fetch the question paper from MongoDB
	var questionPaper models.QuestionPaper
	err = questionPaperCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&questionPaper)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Question paper not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch question paper"})
		}
		return
	}

	// Return the question paper details
	c.JSON(http.StatusOK, questionPaper)
}
