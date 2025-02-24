package controllers

import (
	"context"
	"fmt"
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
	update := bson.M{"$set": exam}
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
