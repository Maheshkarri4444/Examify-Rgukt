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

	// Fetch teacher's container
	err := teacherContainerCollection.FindOne(ctx, bson.M{"_id": containerID}).Decode(&teacherContainer)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Teacher container not found"})
		return
	}

	// Extract exam IDs
	examIDs := make([]primitive.ObjectID, 0)
	for _, e := range teacherContainer.Exams {
		examIDs = append(examIDs, e.ExamID)
	}

	// Fetch exams from database
	cursor, err := examCollection.Find(ctx, bson.M{"_id": bson.M{"$in": examIDs}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch exams"})
		return
	}
	defer cursor.Close(ctx)

	// Filter exams (remove those with answer sheets)
	var exams []models.Exam
	for cursor.Next(ctx) {
		var exam models.Exam
		if err := cursor.Decode(&exam); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding exam"})
			return
		}
		// fmt.Println("exam answersheets: ", exam.AnswerSheets)
		// Only add exams that have NO answer sheets
		if len(exam.AnswerSheets) == 0 {
			exams = append(exams, exam)
		}
	}

	c.JSON(http.StatusOK, exams)
}

func GetFinishedExamsByTeacherContainerID(c *gin.Context) {
	containerID := c.MustGet("container_id").(primitive.ObjectID)
	var teacherContainer struct {
		Exams []struct {
			ExamID primitive.ObjectID `bson:"exam_id"`
		} `bson:"exams"`
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Fetch teacher's container
	err := teacherContainerCollection.FindOne(ctx, bson.M{"_id": containerID}).Decode(&teacherContainer)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Teacher container not found"})
		return
	}

	// Extract exam IDs
	examIDs := make([]primitive.ObjectID, 0)
	for _, e := range teacherContainer.Exams {
		examIDs = append(examIDs, e.ExamID)
	}

	// Fetch exams from database
	cursor, err := examCollection.Find(ctx, bson.M{"_id": bson.M{"$in": examIDs}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch exams"})
		return
	}
	defer cursor.Close(ctx)

	// Filter exams (keep only those with at least one answer sheet)
	var finishedExams []models.Exam
	for cursor.Next(ctx) {
		var exam models.Exam
		if err := cursor.Decode(&exam); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding exam"})
			return
		}

		// Only add exams that have at least one answer sheet
		if len(exam.AnswerSheets) > 0 {
			finishedExams = append(finishedExams, exam)
		}
	}

	c.JSON(http.StatusOK, finishedExams)
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
	// fmt.Println("examid: ", examID)
	err = examCollection.FindOne(ctx, bson.M{"_id": examID}).Decode(&exam)
	// fmt.Println("exam: ", exam)
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

var answerSheetCollection *mongo.Collection = config.GetCollection(config.Client, "answersheets")

func GetAvailableExamsByDate(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Get user container_id from context (set in AuthMiddleware)
	containerIDValue, exists := c.Get("container_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User container not found"})
		return
	}

	containerID, ok := containerIDValue.(primitive.ObjectID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid container ID"})
		return
	}

	// Step 1: Get all exams available today
	today := time.Now().UTC().Truncate(24 * time.Hour)
	startOfDay := primitive.NewDateTimeFromTime(today)
	endOfDay := primitive.NewDateTimeFromTime(today.Add(24 * time.Hour))

	examFilter := bson.M{
		"available_dates": bson.M{
			"$elemMatch": bson.M{
				"$gte": startOfDay,
				"$lt":  endOfDay,
			},
		},
	}

	cursor, err := examCollection.Find(ctx, examFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch exams"})
		return
	}
	defer cursor.Close(ctx)

	var allExams []models.Exam
	if err = cursor.All(ctx, &allExams); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse exams"})
		return
	}

	// Collect all available exam IDs
	availableExamIDs := make(map[primitive.ObjectID]models.Exam)
	for _, exam := range allExams {
		availableExamIDs[exam.ID] = exam
	}

	// Step 2: Fetch student's container
	var studentContainer models.StudentContainer
	err = studentContainerCollection.FindOne(ctx, bson.M{"_id": containerID}).Decode(&studentContainer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch student container"})
		return
	}

	// Step 3: Iterate over studentContainer.QuestionPapers and check AnswerSheets
	for _, qp := range studentContainer.QuestionPapers {
		// If the exam ID is in today's available exams, check its answer sheet
		if _, exists := availableExamIDs[qp.ExamID]; exists {
			var answerSheet models.AnswerSheet
			err := answerSheetCollection.FindOne(ctx, bson.M{"_id": qp.AnswerSheetID}).Decode(&answerSheet)
			if err == nil && answerSheet.Submitted {
				// If the answer sheet is submitted, remove this exam from available list
				delete(availableExamIDs, qp.ExamID)
			}
		}
	}

	// Convert remaining available exams to response format
	var examsResponse []bson.M
	for _, exam := range availableExamIDs {
		examsResponse = append(examsResponse, bson.M{
			"_id":       exam.ID,
			"exam_name": exam.ExamName,
			"exam_type": exam.ExamType,
			"duration":  exam.Duration,
		})
	}

	c.JSON(http.StatusOK, examsResponse)
}

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

	// Fetch user details to get ContainerID
	var user struct {
		ContainerID primitive.ObjectID `bson:"contianer_id"`
	}
	err = userCollection.FindOne(context.TODO(), bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		fmt.Println("user collection error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	// Fetch student's container
	var studentContainer models.StudentContainer
	err = studentContainerCollection.FindOne(context.TODO(), bson.M{"_id": user.ContainerID}).Decode(&studentContainer)
	if err != nil {
		fmt.Println("student container collection error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch student container"})
		return
	}

	// Check if the exam is already assigned
	for _, assignedExam := range studentContainer.QuestionPapers {
		if assignedExam.ExamID == examObjID {
			// Fetch the existing answer sheet
			var existingAnswerSheet bson.M
			err := answerSheetCollection.FindOne(context.TODO(), bson.M{
				"_id":       assignedExam.AnswerSheetID,
				"email":     userEmail,
				"submitted": false,
			}).Decode(&existingAnswerSheet)

			if err == nil {
				c.JSON(http.StatusOK, existingAnswerSheet)
				return
			}
		}
	}

	// Fetch exam details
	var exam struct {
		Name         string               `bson:"exam_name"`
		ExamType     string               `bson:"exam_type"`
		Sets         []primitive.ObjectID `bson:"sets"`
		AnswerSheets []primitive.ObjectID `bson:"answer_sheets"`
		Duration     int64                `bson:"duration"`
	}
	err = examCollection.FindOne(context.TODO(), bson.M{"_id": examObjID}).Decode(&exam)
	if err != nil {
		fmt.Println("exam collection error")
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
	var qPaper models.QuestionPaper
	err = questionPaperCollection.FindOne(context.TODO(), bson.M{"_id": selectedQPaperID}).Decode(&qPaper)
	if err != nil {
		fmt.Println("question papercollection error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Question paper not found"})
		return
	}

	answers := make([]struct {
		Question string `bson:"question" json:"question"`
		Answers  []struct {
			Type string `bson:"type" json:"type"`
			Ans  string `bson:"ans" json:"ans"`
		} `bson:"answers" json:"answers"`
	}, len(qPaper.Questions))

	for i, q := range qPaper.Questions {
		answers[i].Question = q.Question
		answers[i].Answers = make([]struct {
			Type string `bson:"type" json:"type"`
			Ans  string `bson:"ans" json:"ans"`
		}, len(q.Types))

		for j, qType := range q.Types {
			answers[i].Answers[j] = struct {
				Type string `bson:"type" json:"type"`
				Ans  string `bson:"ans" json:"ans"`
			}{Type: qType, Ans: ""}
		}
	}

	answerSheet := bson.M{
		"student_name": userName,
		"email":        userEmail,
		"exam_name":    exam.Name,
		"exam_id":      examObjID,
		"exam_type":    exam.ExamType,
		"qpaper_id":    selectedQPaperID,
		"set":          qPaper.Set,
		"status":       "didnotstart",
		"submitted":    false,
		"data":         answers,
		"duration":     exam.Duration,
	}
	if exam.ExamType == "internal" {
		answerSheet["status"] = "internal"
	}

	// Insert answer sheet
	result, err := answerSheetCollection.InsertOne(context.TODO(), answerSheet)
	if err != nil {
		fmt.Println("answersheet collection error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create answer sheet"})
		return
	}
	ansSheetID := result.InsertedID.(primitive.ObjectID)

	// Update exam data to store answer sheet ID
	examCollection.UpdateOne(context.TODO(), bson.M{"_id": examObjID}, bson.M{"$push": bson.M{"answer_sheets": ansSheetID}})

	// Update student's container with assigned question paper
	_, err = studentContainerCollection.UpdateOne(context.TODO(),
		bson.M{"_id": studentContainer.ID},
		bson.M{"$push": bson.M{"question_papers": bson.M{
			"exam_id":           examObjID,
			"question_paper_id": selectedQPaperID,
			"answer_sheet_id":   ansSheetID,
		}}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update student container"})
		return
	}

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
			Answers  []struct {
				Type string `json:"type"`
				Ans  string `json:"ans"`
			} `json:"answers"`
		} `json:"answers"`
		AIScore *float64 `json:"ai_score,omitempty"`
	}

	// Bind request body
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Find the existing answer sheet
	var answerSheet models.AnswerSheet
	err = answerSheetCollection.FindOne(context.TODO(), bson.M{"_id": objID}).Decode(&answerSheet)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Answer sheet not found"})
		return
	}

	// Ensure the exam is in progress before submitting
	if answerSheet.Status != "started" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exam has not been started or is already submitted"})
		return
	}

	// Map submitted answers to the existing answer sheet structure
	for i, q := range answerSheet.Data {
		for _, submittedQ := range requestBody.Answers {
			if q.Question == submittedQ.Question {
				for j, ans := range q.Answers {
					for _, submittedAns := range submittedQ.Answers {
						if ans.Type == submittedAns.Type {
							answerSheet.Data[i].Answers[j].Ans = submittedAns.Ans
						}
					}
				}
			}
		}
	}

	// Update the answer sheet in the database
	update := bson.M{
		"$set": bson.M{
			"status":    "ended",
			"submitted": true,
			"data":      answerSheet.Data,
			"ai_score":  requestBody.AIScore,
		},
	}

	_, err = answerSheetCollection.UpdateOne(context.TODO(), bson.M{"_id": objID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit the exam"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Exam submitted successfully"})
}

func GetAnswerSheetByID(c *gin.Context) {
	answerSheetID := c.Param("id")
	ansSheetObjID, err := primitive.ObjectIDFromHex(answerSheetID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid answer sheet ID"})
		return
	}

	var answerSheet models.AnswerSheet
	err = answerSheetCollection.FindOne(context.TODO(), bson.M{"_id": ansSheetObjID}).Decode(&answerSheet)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Answer sheet not found"})
		return
	}

	c.JSON(http.StatusOK, answerSheet)
}

func GetAllAnswerSheetsByExamID(c *gin.Context) {
	examID := c.Param("examid") // Get exam ID from URL params
	// fmt.Println("getallanswersheets function called")

	// Convert examID to ObjectID
	objID, err := primitive.ObjectIDFromHex(examID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid exam ID"})
		return
	}

	// Define MongoDB filter
	filter := bson.M{"exam_id": objID}

	// Query MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := answerSheetCollection.Find(ctx, filter)
	if err != nil {
		fmt.Println("error here at cursor")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch answer sheets"})
		return
	}
	defer cursor.Close(ctx)

	// Fetch evaluated answer sheets where evaluated is true
	evaluatedSheetsCursor, err := evaluationCollection.Find(ctx, bson.M{"evaluated": true})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch evaluated answer sheets"})
		return
	}
	defer evaluatedSheetsCursor.Close(ctx)

	evaluatedSheetIDs := make(map[primitive.ObjectID]bool)

	for evaluatedSheetsCursor.Next(ctx) {
		var evaluation models.Evaluation
		if err := evaluatedSheetsCursor.Decode(&evaluation); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding evaluation"})
			return
		}
		evaluatedSheetIDs[evaluation.AnswerSheetID] = true
	}

	// Prepare answer sheets list excluding evaluated ones
	var answerSheets []bson.M

	for cursor.Next(ctx) {
		var answerSheet models.AnswerSheet
		if err := cursor.Decode(&answerSheet); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding answer sheet"})
			return
		}

		if _, evaluated := evaluatedSheetIDs[answerSheet.ID]; evaluated {
			continue
		}

		answerSheets = append(answerSheets, bson.M{
			"id":          answerSheet.ID,
			"studentName": answerSheet.StudentName,
			"email":       answerSheet.Email,
			"qpaperId":    answerSheet.QPaperID,
			"set":         answerSheet.Set,
			"status":      answerSheet.Status,
			"submitted":   answerSheet.Submitted,
		})
	}

	// Return response
	c.JSON(http.StatusOK, answerSheets)
}

var evaluationCollection *mongo.Collection = config.GetCollection(config.Client, "evaluations")

func CreateEvaluationByAnswerSheetID(c *gin.Context) {
	answerSheetID := c.Param("answersheetid")

	// Convert answerSheetID to ObjectID
	objID, err := primitive.ObjectIDFromHex(answerSheetID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid answer sheet ID"})
		return
	}

	// Check if evaluation already exists for this answer sheet
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var existingEvaluation models.Evaluation
	err = evaluationCollection.FindOne(ctx, bson.M{"answer_sheet_id": objID}).Decode(&existingEvaluation)
	if err == nil {
		// Evaluation already exists, return its ID
		c.JSON(http.StatusOK, gin.H{"message": "Evaluation already exists", "evaluation_id": existingEvaluation.ID})
		return
	}

	// Fetch the AnswerSheet
	var answerSheet models.AnswerSheet
	err = answerSheetCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&answerSheet)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Answer sheet not found"})
		return
	}

	// Prepare evaluation data
	evaluation := models.Evaluation{
		ID:            primitive.NewObjectID(),
		AnswerSheetID: answerSheet.ID,
		StudentName:   answerSheet.StudentName,
		Email:         answerSheet.Email,
		ExamName:      answerSheet.ExamName,
		ExamID:        answerSheet.ExamID,
		QPaperID:      answerSheet.QPaperID,
		Set:           answerSheet.Set,
		AIScore:       answerSheet.AIScore,
		Data: []struct {
			Question string `bson:"question" json:"question"`
			Answers  []struct {
				Type string `bson:"type" json:"type"`
				Ans  string `bson:"ans" json:"ans"`
			} `bson:"answers" json:"answers"`
			AIEvaluation string `bson:"ai_evaluation" json:"ai_evaluation"`
			Marks        int    `bson:"marks" json:"marks"`
		}{},
		TotalMarks: 0,
		Evaluated:  false,
	}

	// Copy data from answer sheet and add empty evaluation fields
	for _, q := range answerSheet.Data {
		evalData := struct {
			Question string `bson:"question" json:"question"`
			Answers  []struct {
				Type string `bson:"type" json:"type"`
				Ans  string `bson:"ans" json:"ans"`
			} `bson:"answers" json:"answers"`
			AIEvaluation string `bson:"ai_evaluation" json:"ai_evaluation"`
			Marks        int    `bson:"marks" json:"marks"`
		}{
			Question: q.Question,
			Answers:  q.Answers,
			Marks:    0, // Marks field empty initially
		}

		evaluation.Data = append(evaluation.Data, evalData)
	}

	// Insert evaluation into DB
	res, err := evaluationCollection.InsertOne(ctx, evaluation)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create evaluation"})
		return
	}

	// Get teacher container and update with new evaluation ID
	teacherContainerFilter := bson.M{"exams.exam_id": answerSheet.ExamID}
	update := bson.M{"$push": bson.M{"exams.$.evaluation_id": evaluation.ID}}
	_, err = teacherContainerCollection.UpdateOne(ctx, teacherContainerFilter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update teacher container"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Evaluation created successfully", "evaluation_id": res.InsertedID})
}

func GetEvaluationByID(c *gin.Context) {
	evaluationID := c.Param("evaluationid")

	// Convert evaluationID to ObjectID
	objID, err := primitive.ObjectIDFromHex(evaluationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid evaluation ID"})
		return
	}

	// Fetch evaluation from DB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var evaluation models.Evaluation
	err = evaluationCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&evaluation)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Evaluation not found"})
		return
	}

	// Return evaluation details
	c.JSON(http.StatusOK, evaluation)
}

func UpdateEvaluation(c *gin.Context) {
	evaluationID := c.Param("evaluationId")

	// Convert evaluationID to ObjectID
	objID, err := primitive.ObjectIDFromHex(evaluationID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid evaluation ID"})
		return
	}

	// Parse request body
	var requestBody struct {
		Data []struct {
			Question     string `json:"question"`
			Marks        int    `json:"marks"`
			AIEvaluation string `json:"ai_evaluation"`
			Answers      []struct {
				Type string `json:"type"`
				Ans  string `json:"ans"`
			} `json:"answers"`
		} `json:"data"`
		TotalMarks int  `json:"total_marks"`
		Evaluated  bool `json:"evaluated"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Update evaluation in MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"data":        requestBody.Data,
			"total_marks": requestBody.TotalMarks,
			"evaluated":   requestBody.Evaluated,
		},
	}

	_, err = evaluationCollection.UpdateOne(ctx, bson.M{"_id": objID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update evaluation"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Evaluation updated successfully"})
}

func GetEvaluatedExamsByTeacherContainer(c *gin.Context) {
	containerID := c.MustGet("container_id").(primitive.ObjectID)

	var teacherContainer models.TeacherContainer
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Fetch the teacher's container
	err := teacherContainerCollection.FindOne(ctx, bson.M{"_id": containerID}).Decode(&teacherContainer)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Teacher container not found"})
		return
	}

	var evaluatedExams []bson.M

	// Iterate through exams and fetch only those with evaluated sheets
	for _, exam := range teacherContainer.Exams {
		if len(exam.EvaluationID) == 0 {
			continue
		}

		var evaluations []models.Evaluation

		for _, evalID := range exam.EvaluationID {
			// fmt.Println("evalId: ", evalID)
			var evaluation models.Evaluation
			err := evaluationCollection.FindOne(ctx, bson.M{"_id": evalID, "evaluated": true}).Decode(&evaluation)
			if err == nil { // Only append if the document exists
				evaluations = append(evaluations, evaluation)
			}
		}
		// fmt.Println("evalutions data: ", evaluations)
		if len(evaluations) > 0 {
			// Fetch exam details
			var examDetails models.Exam
			err := examCollection.FindOne(ctx, bson.M{"_id": exam.ExamID}).Decode(&examDetails)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch exam details"})
				return
			}

			// Append evaluated exam details to response
			evaluatedExams = append(evaluatedExams, bson.M{
				"exam_id":       exam.ExamID,
				"exam_name":     examDetails.ExamName,
				"evaluation_id": exam.EvaluationID,
				"evaluations":   evaluations,
			})
		}
	}

	c.JSON(http.StatusOK, evaluatedExams)
}

func GetAllStudentDetailsAndMarksByExamID(c *gin.Context) {
	examID := c.Param("examid")

	// Convert examID to ObjectID
	objID, err := primitive.ObjectIDFromHex(examID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid exam ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Fetch only evaluated evaluations for the given exam ID
	cursor, err := evaluationCollection.Find(ctx, bson.M{"exam_id": objID, "evaluated": true})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch evaluations"})
		return
	}
	defer cursor.Close(ctx)

	var studentDetails []bson.M
	for cursor.Next(ctx) {
		var evaluation models.Evaluation
		if err := cursor.Decode(&evaluation); err != nil {
			continue // Skip decoding errors and process remaining records
		}

		studentDetails = append(studentDetails, bson.M{
			"student_name": evaluation.StudentName,
			"email":        evaluation.Email,
			"total_marks":  evaluation.TotalMarks,
			"evaluated":    evaluation.Evaluated,
		})
	}

	c.JSON(http.StatusOK, studentDetails)
}
