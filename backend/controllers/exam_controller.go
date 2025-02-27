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
	"go.mongodb.org/mongo-driver/mongo/options"
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

func GetAvailableExamsByDate(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	today := time.Now().UTC().Truncate(24 * time.Hour)

	filter := bson.M{"available_dates": bson.M{"$elemMatch": bson.M{"$eq": today}}}
	options := options.Find().SetProjection(bson.M{
		"_id":       1,
		"exam_name": 1,
		"exam_type": 1,
		"duration":  1,
	})

	cursor, err := examCollection.Find(ctx, filter, options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var exams []bson.M
	if err = cursor.All(ctx, &exams); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	fmt.Println("exams data : ", exams)
	c.JSON(http.StatusOK, exams)
}

var answerSheetCollection *mongo.Collection = config.GetCollection(config.Client, "answersheets")

func AssignSetAndCreateAnswerSheet(c *gin.Context) {
	examID := c.Param("qpaperid")
	userID, _ := c.Get("user_id")
	userEmail, _ := c.Get("email")
	userName, _ := c.Get("name")

	examObjID, err := primitive.ObjectIDFromHex(examID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid exam ID"})
		return
	}

	// Fetch the student's existing container
	var studentContainer struct {
		Sets []primitive.ObjectID `bson:"sets"`
	}
	err = config.GetCollection(config.Client, "users").FindOne(context.TODO(), bson.M{"_id": userID}).Decode(&studentContainer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch student data"})
		return
	}

	// Check if the exam is already assigned
	for _, assignedExam := range studentContainer.Sets {
		if assignedExam == examObjID {
			var existingAnswerSheet bson.M
			err := answerSheetCollection.FindOne(context.TODO(), bson.M{"exam_id": examObjID, "email": userEmail, "submitted": false}).Decode(&existingAnswerSheet)
			if err == nil {
				c.JSON(http.StatusOK, existingAnswerSheet)
				return
			}
		}
	}

	// Fetch exam details
	var exam struct {
		Name         string               `bson:"name"`
		ExamType     string               `bson:"exam_type"`
		Sets         []primitive.ObjectID `bson:"sets"`
		AnswerSheets []primitive.ObjectID `bson:"answersheets"`
		Duration     int64                `bson:"duration"`
	}
	err = examCollection.FindOne(context.TODO(), bson.M{"_id": examObjID}).Decode(&exam)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Exam not found"})
		return
	}

	// Find unassigned question paper
	assignedQPaperMap := make(map[primitive.ObjectID]bool)
	for _, ansSheetID := range exam.AnswerSheets {
		var ansSheet struct {
			QPaperID primitive.ObjectID `bson:"qpaper_id"`
		}
		answerSheetCollection.FindOne(context.TODO(), bson.M{"_id": ansSheetID}).Decode(&ansSheet)
		assignedQPaperMap[ansSheet.QPaperID] = true
	}

	var selectedQPaperID primitive.ObjectID
	for _, set := range exam.Sets {
		if !assignedQPaperMap[set] {
			selectedQPaperID = set
			break
		}
	}

	// If no unique question paper found, assign a random one
	if selectedQPaperID.IsZero() {
		rand.Seed(time.Now().UnixNano())
		selectedQPaperID = exam.Sets[rand.Intn(len(exam.Sets))]
	}

	// Fetch question paper
	var qPaper struct {
		Questions []struct {
			Question string `bson:"question"`
			Type     string `bson:"type"`
		} `bson:"questions"`
	}
	err = config.GetCollection(config.Client, "questionpapers").FindOne(context.TODO(), bson.M{"_id": selectedQPaperID}).Decode(&qPaper)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Question paper not found"})
		return
	}

	// Prepare answer sheet data
	answers := make([]bson.M, len(qPaper.Questions))
	for i, q := range qPaper.Questions {
		answers[i] = bson.M{"question": q.Question, "type": q.Type, "ans": ""}
	}

	answerSheet := bson.M{
		"name":       userName,
		"email":      userEmail,
		"exam_name":  exam.Name,
		"exam_id":    examObjID,
		"exam_type":  exam.ExamType,
		"qpaper_id":  selectedQPaperID,
		"set_number": selectedQPaperID,
		"status":     "didnotstart",
		"submitted":  false,
		"data":       answers,
		"duration":   exam.Duration,
	}
	if exam.ExamType == "internal" {
		answerSheet["status"] = "internal"
	}

	// Insert answer sheet
	result, err := answerSheetCollection.InsertOne(context.TODO(), answerSheet)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create answer sheet"})
		return
	}
	ansSheetID := result.InsertedID.(primitive.ObjectID)

	// Update exam data to store answer sheet ID
	examCollection.UpdateOne(context.TODO(), bson.M{"_id": examObjID}, bson.M{"$push": bson.M{"answersheets": ansSheetID}})

	c.JSON(http.StatusOK, answerSheet)
}

func StartExam(c *gin.Context) {
	answerSheetID := c.Param("answerSheetId")
	objID, err := primitive.ObjectIDFromHex(answerSheetID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid answerSheet ID"})
		return
	}

	// Update the status to "started"
	update := bson.M{"$set": bson.M{"status": "started"}}
	_, err = answerSheetCollection.UpdateOne(context.TODO(), bson.M{"_id": objID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start the exam"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Exam started successfully"})
}

// Submit Exam - Updates the status to "ended", marks submitted as true, and stores the answers
func SubmitExam(c *gin.Context) {
	answerSheetID := c.Param("answerSheetId")
	objID, err := primitive.ObjectIDFromHex(answerSheetID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid answerSheet ID"})
		return
	}

	// Define request body structure
	var requestBody struct {
		Answers []struct {
			Question string `json:"question"`
			Type     string `json:"type"`
			Answer   string `json:"answer"`
		} `json:"answers"`
	}

	// Bind request body
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Find the answer sheet
	var answerSheet struct {
		ID     primitive.ObjectID `bson:"_id"`
		Status string             `bson:"status"`
	}

	err = answerSheetCollection.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&answerSheet)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Answer sheet not found"})
		return
	}

	// Ensure the exam was started before submitting
	if answerSheet.Status != "started" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exam has not been started"})
		return
	}

	// Update the answer sheet with the submitted answers
	update := bson.M{
		"$set": bson.M{
			"status":    "ended",
			"submitted": true,
			"data":      requestBody.Answers,
		},
	}

	_, err = answerSheetCollection.UpdateOne(context.TODO(), bson.M{"_id": objID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit the exam"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Exam submitted successfully"})
}
