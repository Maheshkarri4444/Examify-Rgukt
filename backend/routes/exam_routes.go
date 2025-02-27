package routes

import (
	"github.com/Maheshkarri4444/Examify/controllers"
	"github.com/Maheshkarri4444/Examify/middleware"
	"github.com/gin-gonic/gin"
)

func ExamRoutes(r *gin.Engine) {
	exam := r.Group("/exam")
	{
		exam.POST("/create-exam", middleware.TeacherMiddleware(), controllers.CreateExam)
		exam.PUT("/update-exam", middleware.TeacherMiddleware(), controllers.UpdateExam)
		exam.POST("/exam/create-sets", controllers.CreateSetsForExam)
		exam.GET("/qpaper/:id", controllers.GetQuestionPaperByID)
		exam.GET("/getallexams", controllers.GetAllExams)
		exam.GET("/getexambyid", controllers.GetExamById)
		exam.GET("/getexamsbycontainer", middleware.TeacherMiddleware(), controllers.GetExamsByTeacherContainer)

		exam.GET("/getexamsbydate", middleware.StudentMiddleware(), controllers.GetAvailableExamsByDate)
		exam.POST("/assignsetandcreateanswersheet/:qpaperid", middleware.StudentMiddleware(), controllers.AssignSetAndCreateAnswerSheet)

		exam.POST("/start-exam/:answerSheetId", middleware.StudentMiddleware(), controllers.StartExam)
		exam.POST("/submit-exam/:answerSheetId", middleware.StudentMiddleware(), controllers.SubmitExam)
		exam.GET("/answer-sheet/:id", middleware.StudentMiddleware(), controllers.GetAnswerSheetByID)
		//student
		//getexamsbydate
		//getsetandcreateanswersheet-post //searches that exam id in student container
		//if not it will assign a qpaper and answersheet with empty answers, this answersheet id will be pushed to the examdata , and return answersheet
		//if there is already examid and not submited return the answesheet
		//aiscore-post

		//after submission generate aiscore and backend push to the answersheet

		//evalution
		//getallanswersheetsbyexamid
		//createevalutionforanssheet--created answersheet with name email qutions and answers from anssheet
		//aievaluate-post

		//result
		//getevalutionpaperbyansid
		//getresultsbyexamid

	}

}
